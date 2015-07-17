
import R from "ramda";

var sequence = 0;

const setDefaultHeaders = R.evolve({
    headers: R.merge({"x-csrf-token": window.CSRF_TOKEN})
});

const setDefaultOptions = R.compose(setDefaultHeaders, R.merge({
    credentials: "same-origin",
    method: "GET",
    headers: {}
}));


export default function fetch(context, payload) {
    const fetchId = ++sequence;
    var options = setDefaultOptions(payload);
    const path = options.path;
    if (!path) throw new Error("payload.path is missing");

    context.dispatch("FETCH_START", {path, fetchId, options});

    return window.fetch(path, options)
    .catch(error => {
        context.dispatch("FETCH_FAILED", {path, error, fetchId, options});
        context.dispatch("FETCH_END", {path, fetchId, options});
        throw error;
    })
    .then(res => res.json())
    .then(data => {
        context.dispatch("FETCH_END", {path, fetchId, options});
        context.dispatch("FETCH_SUCCESS", {path, data, fetchId, options});
        return data;
    });
}


