#pragma once

#include "colla/core.h"
#include "colla/str.h"
#include "colla/net.h"

typedef struct arena_t arena_t;
typedef struct server_t server_t;

typedef struct server_field_t {
    str_t key;
    str_t value;
    struct server_field_t *next;
} server_field_t;

typedef struct {
    http_method_e method;
    str_t page;
    server_field_t *page_fields;
    u8 version_minor;
    u8 version_major;
    server_field_t *fields;
    server_field_t *fields_tail;
    // buffer_t body;
} server_req_t;

typedef str_t (*server_route_f)(arena_t scratch, server_t *server, server_req_t *req, void *userdata);

server_t *server_setup(arena_t *arena, u16 port, bool try_next_port);
void server_route(arena_t *arena, server_t *server, strview_t page, server_route_f cb, void *userdata);
void server_route_default(arena_t *arena, server_t *server, server_route_f cb, void *userdata);
oshandle_t server_bind_handle(server_t *server);
socket_t server_acquire_client(server_t *server);
void server_handle_client(arena_t scratch, server_t *server);

str_t server_make_response(arena_t *arena, int status_code, strview_t content_type, strview_t body);
socket_t server_get_client(server_t *server);
void server_set_client(server_t *server, socket_t client);