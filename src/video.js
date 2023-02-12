const axios = require("axios");
const { load } = require("cheerio");
const tiny = require("tinyurl");
const regex = require("./utils");
const log = require("../log");

async function video(url) {
  const res = (await axios.get("https://registry.npmjs.org/y2mate-api")).data;
  if (require("../package.json").version != res["dist-tags"].latest) {
    log("-> Y2Mate-API New Version Available");
    log(`-> Latest Version: ${res["dist-tags"].latest}`);
    log('-> Enter Console "npm i y2mate-api@latest" To Use Latest Version');
    log("-> Have Fun\n");
  }
  return new Promise(async (resolve, reject) => {
    if ((await regex(url)) == false) {
      reject("Can't See Song ID");
    }
    axios({
      method: "post",
      url: "https://www.y2mate.com/mates/en68/analyze/ajax",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,vi;q=0.8",
        "content-type": "multipart/form-data",
      },
      data: {
        url: url,
        q_auto: 0,
        ajax: 2,
      },
    }).then(async (res) => {
      const $ = load(res.data.result);
      const imageSrc = $('div[class="thumbnail cover"]')
          .find("a > img")
          .attr("src"),
        title = $('div[class="caption text-left"]').find("b").text(),
        size = $("div")
          .find("#mp4 > table > tbody > tr > td:nth-child(2)")
          .text(),
        type = $("div")
          .find("#mp4 > table > tbody > tr > td:nth-child(3) > a")
          .attr("data-ftype"),
        quality = $("div")
          .find("#mp4 > table > tbody > tr > td:nth-child(3) > a")
          .attr("data-fquality"),
        id = /var k__id = "(.*?)"/.exec(res.data.result)[1];
      await axios({
        method: "post",
        url: "https://www.y2mate.com/mates/en68/convert",
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,vi;q=0.8",
          "content-type": "multipart/form-data",
        },
        data: {
          type: "youtube",
          v_id: await regex(url),
          _id: id,
          ajax: "1",
          token: "",
          ftype: type,
          fquality: quality,
        },
      }).then(async function (body) {
        const $ = load(body.data.result);
        var urlDown = $('div[class="form-group has-success has-feedback"]')
          .find("a")
          .attr("href");
        urlDown = await tiny.shorten(urlDown);
        resolve({
          title,
          size,
          type,
          quality,
          imageSrc,
          urlDown,
        });
      });
    });
  });
}

module.exports = video;