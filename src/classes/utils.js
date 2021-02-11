
var escapeHtml = text => {
    let map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => {return map[m];});
};
const encodePathURI = uri => {
    return encodeURI(uri).replace(/#/g, "%23");
};
const purifyCSS = str => {
    if (typeof str === "undefined") return "";
    if (typeof str !== "string") {
        str = str.toString();
    }
    return str.replace(/[<]/g, "");
};
const delay = ms => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
};
// Returns the user's desired display name
async function getDisplayName() {
    let user = settings.username || null;
    if (user)
        return user;

    try {
        user = await require("username")();
    } catch (e) {}

    return user;
}

export {
    escapeHtml,
    encodePathURI,
    purifyCSS,
    delay,
    getDisplayName
}