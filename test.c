typedef enum {
    MSG_EVENT_UPDATE,
    MSG_RESOURCE_UPDATE,
    MSG_ITEM_UPDATE,
    MSG_MINION_UPDATE,
} message_type_e;

#define DEFINE_ENUM(name, ...) name
#define COL_NAME(ENUM, STR) [ENUM] = STR

#define COLOURS(X) \
    X(COL_DEFAULT, "main-col"), \
    X(COL_GREEN, "green-col"), \
    X(COL_YELLOW, "yellow-col"), \
    X(COL_RED, "red-col"), 

typedef enum {
    COLOURS(DEFINE_ENUM)
    COL__COUNT,
} colour_e;

const char *colour_names[COL__COUNT] = {
    COLOURS(COL_NAME)
};

typedef struct resource_t resource_t;
struct resource_t {
    const char *name;
    const char *singular;
    double value;
};

#define RESOURCES(X) \
    X(RES_WOOD, .name = "wood"), \
    X(RES_SEEDS, .name = "seeds", .singular = "seed"), \
    X(RES_WHEAT, .name = "wheat", .value = 0.2), \
    X(RES_STONE, .name = "stone"), \
    X(RES_MONEY, .name = "coins", .singular = "coin"),

typedef enum {
    RESOURCES(DEFINE_ENUM)
    RES__COUNT,
} resources_e;

#define RES_STRUCT(en, ...) [en] = { __VA_ARGS__ }

resource_t resources[RES__COUNT] = {
    RESOURCES(RES_STRUCT)
};