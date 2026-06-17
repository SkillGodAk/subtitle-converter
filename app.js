(function () {
  const core = window.SubtitleConverterCore;
  const state = {
    files: [],
    converters: null
  };

  const els = {
    libraryStatus: document.getElementById("libraryStatus"),
    directionSelect: document.getElementById("directionSelect"),
    cleanupTextCheckbox: document.getElementById("cleanupTextCheckbox"),
    cleanupFileCheckbox: document.getElementById("cleanupFileCheckbox"),
    sourceText: document.getElementById("sourceText"),
    outputText: document.getElementById("outputText"),
    convertTextButton: document.getElementById("convertTextButton"),
    copyOutputButton: document.getElementById("copyOutputButton"),
    downloadTextButton: document.getElementById("downloadTextButton"),
    swapTextButton: document.getElementById("swapTextButton"),
    fileInput: document.getElementById("fileInput"),
    dropZone: document.getElementById("dropZone"),
    convertFilesButton: document.getElementById("convertFilesButton"),
    fileSummary: document.getElementById("fileSummary"),
    resultsList: document.getElementById("resultsList")
  };

  function setStatus(message, kind) {
    els.libraryStatus.textContent = message;
    els.libraryStatus.className = `status-pill ${kind || ""}`.trim();
  }

  function initConverters() {
    if (!window.OpenCC || typeof window.OpenCC.Converter !== "function") {
      setStatus("OpenCC 載入失敗", "error");
      return;
    }

    state.converters = {
      cn2tw: window.OpenCC.Converter({ from: "cn", to: "twp" }),
      tw2cn: window.OpenCC.Converter({ from: "tw", to: "cn" })
    };
    setStatus("轉換核心已就緒", "ready");
  }

  function currentConverter() {
    return state.converters && state.converters[els.directionSelect.value];
  }

  function convertCurrentText() {
    const converter = currentConverter();
    if (!converter) {
      setStatus("轉換核心尚未就緒", "error");
      return;
    }
    els.outputText.value = core.convertText(els.sourceText.value, converter, {
      cleanup: els.cleanupTextCheckbox.checked
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadText(filename, text) {
    downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
  }

  function describeFiles(files) {
    if (!files.length) {
      els.fileSummary.textContent = "尚未選擇檔案。";
      return;
    }
    const subtitleCount = files.filter((file) => core.isSupportedSubtitle(file.name)).length;
    const zipCount = files.filter((file) => core.isZip(file.name)).length;
    els.fileSummary.textContent = `已選擇 ${files.length} 個檔案：${subtitleCount} 個字幕檔，${zipCount} 個 ZIP。`;
  }

  function setFiles(fileList) {
    state.files = Array.from(fileList || []);
    describeFiles(state.files);
    els.resultsList.replaceChildren();
  }

  function addResult(filename, detail, blob) {
    const item = document.createElement("div");
    item.className = "result-item";

    const text = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = filename;
    const meta = document.createElement("span");
    meta.textContent = detail;
    text.append(title, meta);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "下載";
    button.addEventListener("click", () => downloadBlob(blob, filename));

    item.append(text, button);
    els.resultsList.append(item);
  }

  async function convertSubtitleFile(file, converter, options) {
    const text = await file.text();
    const converted = core.convertText(text, converter, options);
    const outputName = core.makeOutputName(file.name, els.directionSelect.value);
    const blob = new Blob([converted], { type: "text/plain;charset=utf-8" });
    addResult(outputName, `${file.name} 已轉換`, blob);
  }

  async function convertZipFile(file, converter, options) {
    if (!window.JSZip) {
      throw new Error("JSZip 尚未載入");
    }

    const zip = await window.JSZip.loadAsync(file);
    const entries = Object.values(zip.files);
    let changed = 0;

    await Promise.all(entries.map(async (entry) => {
      if (entry.dir || !core.isSupportedSubtitle(entry.name)) {
        return;
      }
      const text = await entry.async("string");
      zip.file(entry.name, core.convertText(text, converter, options));
      changed += 1;
    }));

    const blob = await zip.generateAsync({ type: "blob" });
    const outputName = core.makeOutputName(file.name, els.directionSelect.value);
    addResult(outputName, `ZIP 內已轉換 ${changed} 個字幕檔`, blob);
  }

  async function convertFiles() {
    const converter = currentConverter();
    if (!converter) {
      setStatus("轉換核心尚未就緒", "error");
      return;
    }
    if (!state.files.length) {
      els.fileSummary.textContent = "請先選擇字幕檔或 ZIP。";
      return;
    }

    els.convertFilesButton.disabled = true;
    els.resultsList.replaceChildren();
    const options = { cleanup: els.cleanupFileCheckbox.checked };

    try {
      for (const file of state.files) {
        if (core.isSupportedSubtitle(file.name)) {
          await convertSubtitleFile(file, converter, options);
        } else if (core.isZip(file.name)) {
          await convertZipFile(file, converter, options);
        } else {
          addResult(`${file.name}.txt`, "不支援的格式，已略過", new Blob(["Unsupported file"], { type: "text/plain" }));
        }
      }
      els.fileSummary.textContent = "轉換完成，可以下載結果。";
    } catch (error) {
      els.fileSummary.textContent = `轉換失敗：${error.message}`;
    } finally {
      els.convertFilesButton.disabled = false;
    }
  }

  function bindEvents() {
    els.convertTextButton.addEventListener("click", convertCurrentText);
    els.directionSelect.addEventListener("change", () => {
      if (els.sourceText.value) {
        convertCurrentText();
      }
    });
    els.copyOutputButton.addEventListener("click", async () => {
      await navigator.clipboard.writeText(els.outputText.value);
    });
    els.downloadTextButton.addEventListener("click", () => {
      const name = els.directionSelect.value === "tw2cn" ? "converted-simplified.txt" : "converted-traditional.txt";
      downloadText(name, els.outputText.value);
    });
    els.swapTextButton.addEventListener("click", () => {
      els.sourceText.value = els.outputText.value;
      els.outputText.value = "";
      els.directionSelect.value = els.directionSelect.value === "cn2tw" ? "tw2cn" : "cn2tw";
      convertCurrentText();
    });
    els.fileInput.addEventListener("change", (event) => setFiles(event.target.files));
    els.convertFilesButton.addEventListener("click", convertFiles);

    ["dragenter", "dragover"].forEach((eventName) => {
      els.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        els.dropZone.classList.add("dragging");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      els.dropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        els.dropZone.classList.remove("dragging");
      });
    });
    els.dropZone.addEventListener("drop", (event) => setFiles(event.dataTransfer.files));
  }

  initConverters();
  bindEvents();
})();

