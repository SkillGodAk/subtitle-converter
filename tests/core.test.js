const assert = require("node:assert/strict");
const core = require("../core.js");

function testSupportedExtensions() {
  assert.equal(core.isSupportedSubtitle("movie.srt"), true);
  assert.equal(core.isSupportedSubtitle("movie.ass"), true);
  assert.equal(core.isSupportedSubtitle("archive.zip"), false);
  assert.equal(core.isZip("archive.zip"), true);
}

function testCleanupSubtitleText() {
  const input = "{\\an8}<i>你好</i>\\N世界\\h!";
  assert.equal(core.cleanupSubtitleText(input), "你好\n世界 !");
}

function testConvertText() {
  const fakeConverter = (text) => text.replaceAll("汉", "漢");
  assert.equal(core.convertText("汉字", fakeConverter), "漢字");
  assert.equal(core.convertText("{\\pos(1,2)}汉", fakeConverter, { cleanup: true }), "漢");
}

function testMakeOutputName() {
  assert.equal(core.makeOutputName("demo.srt", "cn2tw"), "demo-traditional.srt");
  assert.equal(core.makeOutputName("demo.srt", "tw2cn"), "demo-simplified.srt");
  assert.equal(core.makeOutputName("demo", "cn2tw"), "demo-traditional.txt");
}

testSupportedExtensions();
testCleanupSubtitleText();
testConvertText();
testMakeOutputName();

console.log("core tests passed");

