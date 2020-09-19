export function createVideo(id: string = "local") {
    const dom: any = document.createElement("video");
    dom.controls = true;
    dom.autoplay = true;
    dom.playsinline = true;
    dom.id = id;
    return dom;
}