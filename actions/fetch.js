

var sequence = 0;

export default function fetch(context, path, options) {
    const fetchId = ++sequence;
    options = Object.assign({credentials: "same-origin", method: "GET"});
    options.headers = Object.assign({"x-csrf-token": window.CSRF_TOKEN}, options.headers);

    console.log("fetch start");
    context.dispatch("FETCH_START", {fetchId, options});

    return window.fetch(path, options)
    .catch(error => {
        context.dispatch("FETCH_FAILED", {error, fetchId, options});
        context.dispatch("FETCH_END", {fetchId, options});
        throw error;
    })
    .then(res => res.json())
    .then(data => {
        context.dispatch("FETCH_END", {fetchId, options});
        context.dispatch("FETCH_SUCCESS", {data, fetchId, options});
        return data;
    });
}


