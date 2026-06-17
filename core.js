(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.SubtitleConverterCore = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function () {
  const supportedExtensions = [".srt", ".vtt", ".ass", ".ssa", ".txt"];

  function getExtension(filename) {
    const clean = String(filename || "").toLowerCase();
    const index = clean.lastIndexOf(".");
    return index >= 0 ? clean.slice(index) : "";
  }

  function isSupportedSubtitle(filename) {
    return supportedExtensions.includes(getExtension(filename));
  }

  function isZip(filename) {
    return getExtension(filename) === ".zip";
  }

  function cleanupSubtitleText(text) {
    return String(text || "")
      .replace(/\{\\[^}]*\}/g, "")
      .replace(/\{[^{}]*\\[^{}]*\}/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\\[Nn]/g, "\n")
      .replace(/\\h/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n");
  }

  function convertText(text, converter, options) {
    const opts = options || {};
    const prepared = opts.cleanup ? cleanupSubtitleText(text) : String(text || "");
    return converter ? converter(prepared) : prepared;
  }

  function makeOutputName(filename, direction) {
    const suffix = direction === "tw2cn" ? "simplified" : "traditional";
    const dot = String(filename || "").lastIndexOf(".");
    if (dot <= 0) {
      return `${filename || "converted"}-${suffix}.txt`;
    }
    return `${filename.slice(0, dot)}-${suffix}${filename.slice(dot)}`;
  }

  return {
    supportedExtensions,
    getExtension,
    isSupportedSubtitle,
    isZip,
    cleanupSubtitleText,
    convertText,
    makeOutputName
  };
});

