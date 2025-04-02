#include "colla/build.c"

#include "server.c"

#define MAX_TRIES 5

// DIR WATCHER ////////////////////////////////////

typedef struct os_dirwatcher_t os_dirwatcher_t;
struct os_dirwatcher_t {
    oshandle_t handle;
    // all these variables are internal, don't touch them
    u8 *buffer;
    void *dirhandle;
    usize bufsize;
    u8 *cur_pos;
    void *internal;
    bool subtree;
    bool finished;
};

typedef enum {
    OS_DIRW_FINISHED,
    OS_DIRW_CHANGED,
    OS_DIRW_ADDED,
    OS_DIRW_REMOVED,
    OS_DIRW_RENAMED,
} os_dirw_type_e;

typedef struct os_dirw_change_t os_dirw_change_t;
struct os_dirw_change_t {
    os_dirw_type_e change;
    str_t filename;
    str_t oldname;
};

os_dirwatcher_t dir_watcher_init(arena_t *arena, strview_t path, bool watch_subtree);
os_dirw_change_t dir_watcher_handle_change(arena_t *arena, os_dirwatcher_t *dirw);
void dir_watcher_ignore_rest(os_dirwatcher_t *dirw);

///////////////////////////////////////////////////

///////////////////////////////////////////////////

struct {
    strview_t folder;
    socket_t websocket;
} state = {0};

typedef struct mime_type_t mime_type_t;
struct mime_type_t {
    const char *mime;
    const char *ext;
};

mime_type_t mime_types[] = {
    { "application/octet-stream", ".bin"  },
    { "text/plain",               ".text" },
    { "text/css",                 ".css"  },
    { "text/html",                ".html" },
    { "text/javascript",          ".js"   },
    { "application/json",         ".json" },
    { "image/apng",               ".apng" },
    { "image/avif",               ".avif" },
    { "image/gif",                ".gif"  },
    { "image/jpeg",               ".jpeg" },
    { "image/png",                ".png"  },
    { "image/svg+xml",            ".svg"  },
    { "image/webp",               ".webp" },
};

strview_t filename_to_mime(strview_t path) {
    strview_t ext = STRV_EMPTY;
    os_file_split_path(path, NULL, NULL, &ext);
    for (int i = 0; i < arrlen(mime_types); ++i) {
        if (strv_equals(ext, strv(mime_types[i].ext))) {
            return strv(mime_types[i].mime);
        }
    }
    return strv("text/plain");
}

str_t route_default(arena_t scratch, server_t *server, server_req_t *req, void *userdata) {
    COLLA_UNUSED(userdata);
    COLLA_UNUSED(server);

    strview_t ext = STRV_EMPTY;
    strview_t name = STRV_EMPTY;
    os_file_split_path(strv(req->page), NULL, &name, &ext);
    if (strv_is_empty(ext)) {
        if (strv_equals(name, strv("/"))) {
            req->page = str_fmt(&scratch, "%vindex.html", req->page);
        }
        else {
            req->page = str_fmt(&scratch, "%v.html", req->page);
        }
        return route_default(scratch, server, req, userdata);
    }

    str_t path = str_fmt(&scratch, "%v%v", state.folder, req->page);
    if (os_file_exists(strv(path))) {
        oshandle_t fp = os_handle_zero();
        for (int i = 0; i < MAX_TRIES; ++i) {
            fp = os_file_open(strv(path), FILEMODE_READ);
            if (os_handle_valid(fp)) {
                break;
            }
            Sleep(100);
        }
        if (!os_handle_valid(fp)) {
            err("could not open file (%v) after %d tries", path, MAX_TRIES);
            return server_make_response(&scratch, 505, strv("text/plain"), strv("Server error"));
        }

        str_t data = os_file_read_all_str_fp(&scratch, fp);
        os_file_close(fp);
        return server_make_response(&scratch, 200, filename_to_mime(strv(path)), strv(data));
    }
    else {
        err("(%v) not found", path);
        return server_make_response(&scratch, 404, strv("text/plain"), strv("Page Not Found"));
    }
}

str_t route_websocket(arena_t scratch, server_t *server, server_req_t *req, void *userdata) {
    COLLA_UNUSED(userdata);
    COLLA_UNUSED(server);

    strview_t websocket_key = STRV_EMPTY;
    for_each (field, req->fields) {
        if (strv_equals(strv(field->key), strv("Sec-WebSocket-Key"))) {
            websocket_key = strv(field->value);
            break;
        }
    }
    if (strv_is_empty(websocket_key)) {
        goto failed;
    }

    if (!websocket_init(scratch, server->current_client, websocket_key)) {
        goto failed;
    }

    if (state.websocket) {
        sk_close(state.websocket);
        state.websocket = INVALID_SOCKET;
    }
    state.websocket = server_acquire_client(server);

    buffer_t buf = websocket_encode(&scratch, strv("hello from c!!!"));
    sk_send(state.websocket, buf.data, (int)buf.len);

    return STR_EMPTY;

failed:
    return server_make_response(&scratch, 404, strv("text/plain"), strv("Page Not Found"));
}

void refresh_websocket(arena_t scratch) {
    if (!state.websocket || !sk_is_valid(state.websocket)) {
        return;
    }

    buffer_t buf = websocket_encode(&scratch, strv("reload"));
    sk_send(state.websocket, buf.data, (int)buf.len);
    sk_close(state.websocket);
    state.websocket = INVALID_SOCKET;
}

int main(int argc, char **argv) {
    colla_init(COLLA_ALL);

    if (argc < 2) {
        fatal("usage: reloader <folder>");
    }

    arena_t arena = arena_make(ARENA_VIRTUAL, GB(1));

    state.folder = strv(argv[1]);
    if (strv_ends_with(state.folder, '\\') || strv_ends_with(state.folder, '/')) {
        state.folder = strv_remove_suffix(state.folder, 1);
    }

    server_t *server = server_setup(&arena, 8080, false);
    server_route(&arena, server, strv("/websocket"), route_websocket, NULL);
    server_route_default(&arena, server, route_default, NULL);

    oshandle_t server_handle = server_bind_handle(server);

    os_dirwatcher_t dirw = dir_watcher_init(&arena, state.folder, true);

    while (true) {
        oshandle_t handles[] = {
            dirw.handle,
            server_handle,
        };

        os_wait_t wait = os_wait_on_handles(handles, arrlen(handles), false, INFINITE);
        switch (wait.result) {
            case OS_WAIT_FAILED:
                fatal("wait failed: %v", os_get_error_string(os_get_last_error()));
                break;
            case OS_WAIT_ABANDONED:
                fatal("wait abandoned: %v", os_get_error_string(os_get_last_error()));
                break;
            case OS_WAIT_FINISHED:
                if (wait.index == 0) {
                    info("change?");
                    arena_t scratch = arena;
                    os_dirw_change_t change = dir_watcher_handle_change(&scratch, &dirw);
                    if (change.change != OS_DIRW_FINISHED) {
                        info("changed: %v", change.filename);
                        dir_watcher_ignore_rest(&dirw);
                        refresh_websocket(scratch);
                    }
                }
                else {
                    server_handle_client(arena, server);
                }
                break;
        }
    }

    colla_cleanup();
}

////////////////////////////////////////////////////////////

#define OS_INTERNAL_DIR_WATCH_BUFSIZE (512)

bool dir_watcher__reset(os_dirwatcher_t *dirw) {
    BOOL success = ReadDirectoryChangesW(
        dirw->dirhandle, 
        dirw->buffer, (DWORD)dirw->bufsize, 
        dirw->subtree,
        FILE_NOTIFY_CHANGE_FILE_NAME | 
        FILE_NOTIFY_CHANGE_DIR_NAME |
        FILE_NOTIFY_CHANGE_LAST_WRITE,
        NULL,
        (OVERLAPPED*)dirw->internal, 
        NULL
    );
    dirw->cur_pos = NULL;
    return success;
}

os_dirwatcher_t dir_watcher_init(arena_t *arena, strview_t path, bool watch_subtree) {
    arena_t scratch = *arena;
    str16_t folder = strv_to_str16(&scratch, path);

    DWORD full_len = GetFullPathNameW(folder.buf, 0, NULL, NULL);
    str16_t full_path = {
        .len = full_len,
        .buf = alloc(&scratch, wchar_t, full_len)
    };
    GetFullPathNameW(folder.buf, full_len, full_path.buf, NULL);

    HANDLE dir_handle = CreateFileW(
        full_path.buf,
        FILE_LIST_DIRECTORY,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        NULL,
        OPEN_EXISTING,
        FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OVERLAPPED,
        NULL
    );
    if (dir_handle == INVALID_HANDLE_VALUE) {
        err("couldn't open directory %v", path);
    }

    OVERLAPPED *overlapped = alloc(arena, OVERLAPPED);
    overlapped->hEvent = CreateEvent(NULL, FALSE, 0, NULL);

    usize bufsize = OS_INTERNAL_DIR_WATCH_BUFSIZE;

    u8 *buffer = alloc(arena, u8, bufsize);

    os_dirwatcher_t dirw = {
        .handle.data = (uptr)overlapped->hEvent,
        .buffer = buffer,
        .bufsize = bufsize,
        .dirhandle = dir_handle,
        .internal = overlapped,
        .subtree = watch_subtree,
    };

    if (!dir_watcher__reset(&dirw)) {
        err("failed to start watching directory: %v", os_get_error_string(os_get_last_error()));
    }

    info("watching %v", path);

    return dirw;
}

void dir_watcher_ignore_rest(os_dirwatcher_t *dirw) {
    if (!dir_watcher__reset(dirw)) {
        err("failed to reset dir watcher: %v", os_get_error_string(os_get_last_error()));
    }
    dirw->finished = false;
}

os_dirw_change_t dir_watcher_handle_change(arena_t *arena, os_dirwatcher_t *dirw) {
    os_dirw_change_t out = {0};

    if (dirw->finished) {
        dirw->finished = false;
        return out;
    }

    if (dirw->cur_pos == NULL) {
        DWORD bytes_transferred = 0;
        GetOverlappedResult((HANDLE)dirw->handle.data, (OVERLAPPED*)dirw->internal, &bytes_transferred, FALSE);
        dirw->cur_pos = dirw->buffer;
    }

    bool finished = dirw->finished;

    while (!finished) {
        FILE_NOTIFY_INFORMATION *event = (FILE_NOTIFY_INFORMATION*)dirw->cur_pos;
        DWORD name_len = event->FileNameLength / sizeof(wchar_t);
    
        switch (event->Action) {
            case FILE_ACTION_MODIFIED:
                out.filename = str_from_str16(arena, str16_init(event->FileName, name_len));
                out.change = OS_DIRW_CHANGED;
                finished = true;
                break;
            case FILE_ACTION_ADDED:
                out.filename = str_from_str16(arena, str16_init(event->FileName, name_len));
                out.change = OS_DIRW_ADDED;
                finished = true;
                break;
            case FILE_ACTION_REMOVED:
                out.filename = str_from_str16(arena, str16_init(event->FileName, name_len));
                out.change = OS_DIRW_REMOVED;
                finished = true;
                break;
            case FILE_ACTION_RENAMED_OLD_NAME:
                out.oldname = str_from_str16(arena, str16_init(event->FileName, name_len));
                break;
            case FILE_ACTION_RENAMED_NEW_NAME:
                out.filename = str_from_str16(arena, str16_init(event->FileName, name_len));
                out.change = OS_DIRW_RENAMED;
                finished = true;
                break;
        }

        if (event->NextEntryOffset == 0) {
            dir_watcher__reset(dirw);
            dirw->finished = true;
            break;
        }

        dirw->cur_pos += event->NextEntryOffset;
    }

    return out;
}
