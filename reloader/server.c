#include "server.h"

#include <stdio.h>

#include "colla/arena.h"
#include "colla/os.h"
#include "colla/net.h"

#if !COLLA_TCC
#include <WinSock2.h>
#endif

typedef uptr socket_t;

#define SERVER_BUFSZ 4096

typedef enum {
    PARSE_REQ_BEGIN,
    PARSE_REQ_PAGE,
    PARSE_REQ_VERSION,
    PARSE_REQ_FIELDS,
    PARSE_REQ_FINISHED,
    PARSE_REQ_FAILED,
} server__req_status_e;

typedef struct {
    server_req_t req;
    server__req_status_e status;
    char fullbuf[SERVER_BUFSZ * 2];
    usize prevbuf_len;
} server__req_ctx_t;

typedef struct server__route_t {
    str_t page;
    server_route_f fn;
    void *userdata;
    struct server__route_t *next;
} server__route_t;

typedef struct server_t {
    socket_t socket;
    server__route_t *routes;
    server__route_t *routes_default;
    socket_t current_client;
    bool should_stop;
    u16 port;
    oshandle_t accept_handle;
} server_t;

bool server__parse_chunk(arena_t *arena, server__req_ctx_t *ctx, char buffer[SERVER_BUFSZ], usize buflen) {
    memcpy(ctx->fullbuf + ctx->prevbuf_len, buffer, buflen);
    usize fulllen = ctx->prevbuf_len + buflen;

    instream_t in = istr_init(strv(ctx->fullbuf, fulllen));

#define RESET_STREAM() in.cur = in.beg + begin
#define BEGIN_STREAM() begin = istr_tell(&in)

    usize begin = istr_tell(&in);

    switch (ctx->status) {
        case PARSE_REQ_BEGIN:
        {
            BEGIN_STREAM();

            strview_t method = istr_get_view(&in, ' ');
            if (istr_get(&in) != ' ') {
                RESET_STREAM();
                break;
            }

            if (strv_equals(method, strv("GET"))) {
                ctx->req.method = HTTP_GET;
            }
            else if(strv_equals(method, strv("POST"))) {
                ctx->req.method = HTTP_POST;
            }
            else {
                err("unknown method: (%v)", method);
                ctx->status = PARSE_REQ_FAILED;
                break;
            }

            ctx->status = PARSE_REQ_PAGE;
        }
        // fallthrough
        case PARSE_REQ_PAGE:
        {
            BEGIN_STREAM();
            
            strview_t page = istr_get_view(&in, ' ');
            if (istr_get(&in) != ' ') {
                RESET_STREAM();
                break;
            }

            ctx->req.page = str(arena, page);

            ctx->status = PARSE_REQ_VERSION;
        }
        // fallthrough
        case PARSE_REQ_VERSION:
        {
            BEGIN_STREAM();
            
            strview_t version = istr_get_view(&in, '\n');
            if (istr_get(&in) != '\n') {
                RESET_STREAM();
                break;
            }

            if (version.len < 8) {
                err("version too short: (%v)", version);
                ctx->status = PARSE_REQ_FAILED;
                break;
            }

            if (!strv_equals(strv_sub(version, 0, 4), strv("HTTP"))) {
                err("version does not start with HTTP: (%.4s)", version.buf);
                ctx->status = PARSE_REQ_FAILED;
                break;
            }

            // skip HTTP
            version = strv_remove_prefix(version, 4);

            u8 major, minor;
            int scanned = sscanf(version.buf, "/%hhu.%hhu", &major, &minor);

            if (scanned != 2) {
                err("could not scan both major and minor from version: (%.*s)", version.len, version.buf);
                ctx->status = PARSE_REQ_FAILED;
                break;
            }

            ctx->req.version_major = major;
            ctx->req.version_minor = minor;

            ctx->status = PARSE_REQ_FIELDS;
        }
        // fallthrough
        case PARSE_REQ_FIELDS:
        {
            bool finished_parsing = false;

            while (true) {
                BEGIN_STREAM();

                strview_t field = istr_get_view(&in, '\n');
                if (istr_get(&in) != '\n') {
                    RESET_STREAM();
                    break;
                }

                instream_t field_in = istr_init(field);

                strview_t key = istr_get_view(&field_in, ':');
                if (istr_get(&field_in) != ':') {
                    err("field does not have ':' (%.*s)", field.len, field.buf);
                    ctx->status = PARSE_REQ_FAILED;
                    break;
                }

                istr_skip_whitespace(&field_in);

                strview_t value = istr_get_view(&field_in, '\r');
                if (istr_get(&field_in) != '\r') {
                    warn("field does not finish with \\r: (%.*s)", field.len, field.buf);
                    RESET_STREAM();
                    break;
                }

                server_field_t *new_field = alloc(arena, server_field_t);
                new_field->key = str(arena, key);
                new_field->value = str(arena, value);

                if (!ctx->req.fields) {
                    ctx->req.fields = new_field;
                }
                
                if (ctx->req.fields_tail) {
                    ctx->req.fields_tail->next = new_field;
                }

                ctx->req.fields_tail = new_field;

                // check if we finished parsing the fields
                if (istr_get(&in) == '\r') {
                    if (istr_get(&in) == '\n') {
                        finished_parsing = true;
                        break;
                    }
                    else {
                        istr_rewind_n(&in, 2);
                        warn("should have finished parsing field, but apparently not?: (%.*s)", istr_remaining(&in), in.cur);
                    }
                }
                else {
                    istr_rewind_n(&in, 1);
                }
            }

            if (!finished_parsing) {
                break;
            }

            ctx->status = PARSE_REQ_FINISHED;
            break;
        }
        default: break;
    }

#undef RESET_STREAM

    ctx->prevbuf_len = istr_remaining(&in);

    memmove(ctx->fullbuf, ctx->fullbuf + istr_tell(&in), ctx->prevbuf_len);

    return ctx->status >= PARSE_REQ_FINISHED;
}

void server__parse_req_url(arena_t *arena, server_req_t *req) {
    instream_t in = istr_init(strv(req->page));
    istr_ignore(&in, '?');
    // no fields in url
    if (istr_get(&in) != '?') {
        return;
    }

    req->page.len = istr_tell(&in) - 1;
    req->page.buf[req->page.len] = '\0';

    while (!istr_is_finished(&in)) {
        strview_t field = istr_get_view(&in, '&');
        istr_skip(&in, 1); // skip &
        usize pos = strv_find(field, '=', 0);
        if (pos == SIZE_MAX) {
            fatal("url parameter does not include =: %.*s", field.buf, field.len);
        }
        strview_t key = strv_sub(field, 0, pos);
        strview_t val = strv_sub(field, pos + 1, SIZE_MAX);

        server_field_t *f = alloc(arena, server_field_t);
        f->key = str(arena, key);
        f->value = str(arena, val);
        f->next = req->page_fields;
        req->page_fields = f;
    }
}

server_t *server_setup(arena_t *arena, u16 port, bool try_next_port) {
    socket_t sk = sk_open(SOCK_TCP);
    if (!sk_is_valid(sk)) {
        fatal("couldn't open socket: %v", os_get_error_string(net_get_last_error()));
    }

    bool bound = false;

    while (!bound) {
        bound = sk_bind(sk, SK_ADDR_ANY, port);
        
        if (!bound && try_next_port) {
            port++;
        }
    }

    if (!bound) {
        fatal("couldn't open socket: %v", os_get_error_string(net_get_last_error()));
    }

    if (!sk_listen(sk, 10)) {
        fatal("could not listen on socket: %v", os_get_error_string(net_get_last_error()));
    }

    server_t *server = alloc(arena, server_t);

    server->socket = sk;
    server->port = port;

    info("starting server at: http://localhost:%u", port);
    
    return server;
}

void server_route(arena_t *arena, server_t *server, strview_t page, server_route_f cb, void *userdata) {
    // check if a route for that page already exists
    server__route_t *r = server->routes;

    while (r) {
        if (strv_equals(strv(r->page), page)) {
            r->fn = cb;
            r->userdata = userdata;
            break;
        }
        r = r->next;
    }
    
    // no route found, make a new one
    if (!r) {
        r = alloc(arena, server__route_t);
        r->next = server->routes;
        server->routes = r;

        r->page = str(arena, page);
    }

    r->fn = cb;
    r->userdata = userdata;
}

void server_route_default(arena_t *arena, server_t *server, server_route_f cb, void *userdata) {
    server__route_t *r = server->routes_default;

    if (!r) {
        r = alloc(arena, server__route_t);
        server->routes_default = r;
    }

    r->fn = cb;
    r->userdata = userdata;
}

oshandle_t server_bind_handle(server_t *server) {
    server->accept_handle = sk_bind_event(server->socket, SOCK_EVENT_ACCEPT);
    return server->accept_handle;
}

socket_t server_acquire_client(server_t *server) {
    socket_t client = server->current_client;
    server->current_client = INVALID_SOCKET;
    return client;
}

void server__handle_read(arena_t scratch, server_t *server, socket_t client, oshandle_t event) {
    server__req_ctx_t req_ctx = {0};

    char buffer[SERVER_BUFSZ];
    int read = 0;
    do {
        info("start waiting");
        os_wait_on_handles(&event, 1, TRUE, INFINITE);
        info("finished waiting waiting");
        read = sk_recv(client, buffer, sizeof(buffer));
        if(read == SOCKET_ERROR) {
            fatal("couldn't get the data from the server: %v", os_get_error_string(WSAGetLastError()));
        }
        if (server__parse_chunk(&scratch, &req_ctx, buffer, read)) {
            break;
        }
    } while(read != 0);

    if (req_ctx.status == PARSE_REQ_FAILED || req_ctx.status == PARSE_REQ_BEGIN) {
        err("failed to parse request!");
        return;
    }

    server_req_t req = req_ctx.req;

    server__parse_req_url(&scratch, &req);

    server__route_t *route = server->routes;
    while (route) {
        if (str_equals(route->page, req.page)) {
            break;
        }
        route = route->next;
    }

    if (!route) {
        route = server->routes_default;
    }

    server->current_client = client;
    str_t response = route->fn(scratch, server, &req, route->userdata);

    sk_send(client, response.buf, (int)response.len);
}

void server_handle_client(arena_t scratch, server_t *server) {
    WSANETWORKEVENTS events = {0};
    if (WSAEnumNetworkEvents(server->socket, (HANDLE)server->accept_handle.data, &events)) {
        fatal("error: %v", os_get_error_string(net_get_last_error()));
    }
    if (!(events.lNetworkEvents & FD_ACCEPT)) {
        err("not accept event?: 0x%0x", events.lNetworkEvents);
    }

    socket_t client = sk_accept(server->socket);
    oshandle_t recv_event = sk_bind_event(client, SOCK_EVENT_READ);
    server__handle_read(scratch, server, client, recv_event);
    if (sk_is_valid(server->current_client)) {
        sk_close(server->current_client);
    }
    sk_destroy_event(recv_event);
}

void server_stop(server_t *server) {
    server->should_stop = true;
}

str_t server_make_response(arena_t *arena, int status_code, strview_t content_type, strview_t body) {
    return str_fmt(
        arena,
        
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %v\r\n"
        "\r\n"
        "%v",

        status_code, http_get_status_string(status_code),
        content_type,
        body
    );
}

socket_t server_get_client(server_t *server) {
    return server->current_client;
}

void server_set_client(server_t *server, socket_t client) {
    server->current_client = client;
}

#undef SERVER_BUFSZ