

export function fetchViews(context) {

    window.fetch("/api/views", {
        credentials: "same-origin",
        "headers": { "x-csrf-token": window.CSRF_TOKEN }
    })
    .then(res => {
        context.dispatch("SET_VIEWS", res.json());
    });
}

