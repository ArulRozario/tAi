import {
  __commonJS,
  __toESM
} from "./chunk-46DXP6YY.js";

// node_modules/.pnpm/ua-parser-js@1.0.41/node_modules/ua-parser-js/src/ua-parser.js
var require_ua_parser = __commonJS({
  "node_modules/.pnpm/ua-parser-js@1.0.41/node_modules/ua-parser-js/src/ua-parser.js"(exports, module) {
    (function(window2, undefined2) {
      "use strict";
      var LIBVERSION = "1.0.41", EMPTY = "", UNKNOWN = "?", FUNC_TYPE = "function", UNDEF_TYPE = "undefined", OBJ_TYPE = "object", STR_TYPE = "string", MAJOR = "major", MODEL = "model", NAME = "name", TYPE = "type", VENDOR = "vendor", VERSION2 = "version", ARCHITECTURE = "architecture", CONSOLE = "console", MOBILE = "mobile", TABLET = "tablet", SMARTTV = "smarttv", WEARABLE = "wearable", EMBEDDED = "embedded", UA_MAX_LENGTH = 500;
      var AMAZON = "Amazon", APPLE = "Apple", ASUS = "ASUS", BLACKBERRY = "BlackBerry", BROWSER = "Browser", CHROME = "Chrome", EDGE = "Edge", FIREFOX = "Firefox", GOOGLE = "Google", HONOR = "Honor", HUAWEI = "Huawei", LENOVO = "Lenovo", LG = "LG", MICROSOFT = "Microsoft", MOTOROLA = "Motorola", NVIDIA = "Nvidia", ONEPLUS = "OnePlus", OPERA = "Opera", OPPO = "OPPO", SAMSUNG = "Samsung", SHARP = "Sharp", SONY = "Sony", XIAOMI = "Xiaomi", ZEBRA = "Zebra", FACEBOOK = "Facebook", CHROMIUM_OS = "Chromium OS", MAC_OS = "Mac OS", SUFFIX_BROWSER = " Browser";
      var extend = function(regexes2, extensions) {
        var mergedRegexes = {};
        for (var i3 in regexes2) {
          if (extensions[i3] && extensions[i3].length % 2 === 0) {
            mergedRegexes[i3] = extensions[i3].concat(regexes2[i3]);
          } else {
            mergedRegexes[i3] = regexes2[i3];
          }
        }
        return mergedRegexes;
      }, enumerize = function(arr) {
        var enums = {};
        for (var i3 = 0; i3 < arr.length; i3++) {
          enums[arr[i3].toUpperCase()] = arr[i3];
        }
        return enums;
      }, has = function(str1, str2) {
        return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
      }, lowerize = function(str) {
        return str.toLowerCase();
      }, majorize = function(version) {
        return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split(".")[0] : undefined2;
      }, trim = function(str, len) {
        if (typeof str === STR_TYPE) {
          str = str.replace(/^\s\s*/, EMPTY);
          return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
        }
      };
      var rgxMapper = function(ua, arrays) {
        var i3 = 0, j3, k3, p3, q3, matches, match;
        while (i3 < arrays.length && !matches) {
          var regex = arrays[i3], props = arrays[i3 + 1];
          j3 = k3 = 0;
          while (j3 < regex.length && !matches) {
            if (!regex[j3]) {
              break;
            }
            matches = regex[j3++].exec(ua);
            if (!!matches) {
              for (p3 = 0; p3 < props.length; p3++) {
                match = matches[++k3];
                q3 = props[p3];
                if (typeof q3 === OBJ_TYPE && q3.length > 0) {
                  if (q3.length === 2) {
                    if (typeof q3[1] == FUNC_TYPE) {
                      this[q3[0]] = q3[1].call(this, match);
                    } else {
                      this[q3[0]] = q3[1];
                    }
                  } else if (q3.length === 3) {
                    if (typeof q3[1] === FUNC_TYPE && !(q3[1].exec && q3[1].test)) {
                      this[q3[0]] = match ? q3[1].call(this, match, q3[2]) : undefined2;
                    } else {
                      this[q3[0]] = match ? match.replace(q3[1], q3[2]) : undefined2;
                    }
                  } else if (q3.length === 4) {
                    this[q3[0]] = match ? q3[3].call(this, match.replace(q3[1], q3[2])) : undefined2;
                  }
                } else {
                  this[q3] = match ? match : undefined2;
                }
              }
            }
          }
          i3 += 2;
        }
      }, strMapper = function(str, map) {
        for (var i3 in map) {
          if (typeof map[i3] === OBJ_TYPE && map[i3].length > 0) {
            for (var j3 = 0; j3 < map[i3].length; j3++) {
              if (has(map[i3][j3], str)) {
                return i3 === UNKNOWN ? undefined2 : i3;
              }
            }
          } else if (has(map[i3], str)) {
            return i3 === UNKNOWN ? undefined2 : i3;
          }
        }
        return map.hasOwnProperty("*") ? map["*"] : str;
      };
      var oldSafariMap = {
        "1.0": "/8",
        "1.2": "/1",
        "1.3": "/3",
        "2.0": "/412",
        "2.0.2": "/416",
        "2.0.3": "/417",
        "2.0.4": "/419",
        "?": "/"
      }, windowsVersionMap = {
        "ME": "4.90",
        "NT 3.11": "NT3.51",
        "NT 4.0": "NT4.0",
        "2000": "NT 5.0",
        "XP": ["NT 5.1", "NT 5.2"],
        "Vista": "NT 6.0",
        "7": "NT 6.1",
        "8": "NT 6.2",
        "8.1": "NT 6.3",
        "10": ["NT 6.4", "NT 10.0"],
        "RT": "ARM"
      };
      var regexes = {
        browser: [
          [
            /\b(?:crmo|crios)\/([\w\.]+)/i
            // Chrome for Android/iOS
          ],
          [VERSION2, [NAME, "Chrome"]],
          [
            /edg(?:e|ios|a)?\/([\w\.]+)/i
            // Microsoft Edge
          ],
          [VERSION2, [NAME, "Edge"]],
          [
            // Presto based
            /(opera mini)\/([-\w\.]+)/i,
            // Opera Mini
            /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
            // Opera Mobi/Tablet
            /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i
            // Opera
          ],
          [NAME, VERSION2],
          [
            /opios[\/ ]+([\w\.]+)/i
            // Opera mini on iphone >= 8.0
          ],
          [VERSION2, [NAME, OPERA + " Mini"]],
          [
            /\bop(?:rg)?x\/([\w\.]+)/i
            // Opera GX
          ],
          [VERSION2, [NAME, OPERA + " GX"]],
          [
            /\bopr\/([\w\.]+)/i
            // Opera Webkit
          ],
          [VERSION2, [NAME, OPERA]],
          [
            // Mixed
            /\bb[ai]*d(?:uhd|[ub]*[aekoprswx]{5,6})[\/ ]?([\w\.]+)/i
            // Baidu
          ],
          [VERSION2, [NAME, "Baidu"]],
          [
            /\b(?:mxbrowser|mxios|myie2)\/?([-\w\.]*)\b/i
            // Maxthon
          ],
          [VERSION2, [NAME, "Maxthon"]],
          [
            /(kindle)\/([\w\.]+)/i,
            // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer|sleipnir)[\/ ]?([\w\.]*)/i,
            // Lunascape/Maxthon/Netfront/Jasmine/Blazer/Sleipnir
            // Trident based
            /(avant|iemobile|slim(?:browser|boat|jet))[\/ ]?([\d\.]*)/i,
            // Avant/IEMobile/SlimBrowser/SlimBoat/Slimjet
            /(?:ms|\()(ie) ([\w\.]+)/i,
            // Internet Explorer
            // Blink/Webkit/KHTML based                                         // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
            /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|duckduckgo|klar|helio|(?=comodo_)?dragon)\/([-\w\.]+)/i,
            // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ//Vivaldi/DuckDuckGo/Klar/Helio/Dragon
            /(heytap|ovi|115)browser\/([\d\.]+)/i,
            // HeyTap/Ovi/115
            /(weibo)__([\d\.]+)/i
            // Weibo
          ],
          [NAME, VERSION2],
          [
            /quark(?:pc)?\/([-\w\.]+)/i
            // Quark
          ],
          [VERSION2, [NAME, "Quark"]],
          [
            /\bddg\/([\w\.]+)/i
            // DuckDuckGo
          ],
          [VERSION2, [NAME, "DuckDuckGo"]],
          [
            /(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i
            // UCBrowser
          ],
          [VERSION2, [NAME, "UC" + BROWSER]],
          [
            /microm.+\bqbcore\/([\w\.]+)/i,
            // WeChat Desktop for Windows Built-in Browser
            /\bqbcore\/([\w\.]+).+microm/i,
            /micromessenger\/([\w\.]+)/i
            // WeChat
          ],
          [VERSION2, [NAME, "WeChat"]],
          [
            /konqueror\/([\w\.]+)/i
            // Konqueror
          ],
          [VERSION2, [NAME, "Konqueror"]],
          [
            /trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i
            // IE11
          ],
          [VERSION2, [NAME, "IE"]],
          [
            /ya(?:search)?browser\/([\w\.]+)/i
            // Yandex
          ],
          [VERSION2, [NAME, "Yandex"]],
          [
            /slbrowser\/([\w\.]+)/i
            // Smart Lenovo Browser
          ],
          [VERSION2, [NAME, "Smart Lenovo " + BROWSER]],
          [
            /(avast|avg)\/([\w\.]+)/i
            // Avast/AVG Secure Browser
          ],
          [[NAME, /(.+)/, "$1 Secure " + BROWSER], VERSION2],
          [
            /\bfocus\/([\w\.]+)/i
            // Firefox Focus
          ],
          [VERSION2, [NAME, FIREFOX + " Focus"]],
          [
            /\bopt\/([\w\.]+)/i
            // Opera Touch
          ],
          [VERSION2, [NAME, OPERA + " Touch"]],
          [
            /coc_coc\w+\/([\w\.]+)/i
            // Coc Coc Browser
          ],
          [VERSION2, [NAME, "Coc Coc"]],
          [
            /dolfin\/([\w\.]+)/i
            // Dolphin
          ],
          [VERSION2, [NAME, "Dolphin"]],
          [
            /coast\/([\w\.]+)/i
            // Opera Coast
          ],
          [VERSION2, [NAME, OPERA + " Coast"]],
          [
            /miuibrowser\/([\w\.]+)/i
            // MIUI Browser
          ],
          [VERSION2, [NAME, "MIUI" + SUFFIX_BROWSER]],
          [
            /fxios\/([\w\.-]+)/i
            // Firefox for iOS
          ],
          [VERSION2, [NAME, FIREFOX]],
          [
            /\bqihoobrowser\/?([\w\.]*)/i
            // 360
          ],
          [VERSION2, [NAME, "360"]],
          [
            /\b(qq)\/([\w\.]+)/i
            // QQ
          ],
          [[NAME, /(.+)/, "$1Browser"], VERSION2],
          [
            /(oculus|sailfish|huawei|vivo|pico)browser\/([\w\.]+)/i
          ],
          [[NAME, /(.+)/, "$1" + SUFFIX_BROWSER], VERSION2],
          [
            // Oculus/Sailfish/HuaweiBrowser/VivoBrowser/PicoBrowser
            /samsungbrowser\/([\w\.]+)/i
            // Samsung Internet
          ],
          [VERSION2, [NAME, SAMSUNG + " Internet"]],
          [
            /metasr[\/ ]?([\d\.]+)/i
            // Sogou Explorer
          ],
          [VERSION2, [NAME, "Sogou Explorer"]],
          [
            /(sogou)mo\w+\/([\d\.]+)/i
            // Sogou Mobile
          ],
          [[NAME, "Sogou Mobile"], VERSION2],
          [
            /(electron)\/([\w\.]+) safari/i,
            // Electron-based App
            /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
            // Tesla
            /m?(qqbrowser|2345(?=browser|chrome|explorer))\w*[\/ ]?v?([\w\.]+)/i
            // QQ/2345
          ],
          [NAME, VERSION2],
          [
            /(lbbrowser|rekonq)/i,
            // LieBao Browser/Rekonq
            /\[(linkedin)app\]/i
            // LinkedIn App for iOS & Android
          ],
          [NAME],
          [
            /ome\/([\w\.]+) \w* ?(iron) saf/i,
            // Iron
            /ome\/([\w\.]+).+qihu (360)[es]e/i
            // 360
          ],
          [VERSION2, NAME],
          [
            // WebView
            /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i
            // Facebook App for iOS & Android
          ],
          [[NAME, FACEBOOK], VERSION2],
          [
            /(Klarna)\/([\w\.]+)/i,
            // Klarna Shopping Browser for iOS & Android
            /(kakao(?:talk|story))[\/ ]([\w\.]+)/i,
            // Kakao App
            /(naver)\(.*?(\d+\.[\w\.]+).*\)/i,
            // Naver InApp
            /(daum)apps[\/ ]([\w\.]+)/i,
            // Daum App
            /safari (line)\/([\w\.]+)/i,
            // Line App for iOS
            /\b(line)\/([\w\.]+)\/iab/i,
            // Line App for Android
            /(alipay)client\/([\w\.]+)/i,
            // Alipay
            /(twitter)(?:and| f.+e\/([\w\.]+))/i,
            // Twitter
            /(chromium|instagram|snapchat)[\/ ]([-\w\.]+)/i
            // Chromium/Instagram/Snapchat
          ],
          [NAME, VERSION2],
          [
            /\bgsa\/([\w\.]+) .*safari\//i
            // Google Search Appliance on iOS
          ],
          [VERSION2, [NAME, "GSA"]],
          [
            /musical_ly(?:.+app_?version\/|_)([\w\.]+)/i
            // TikTok
          ],
          [VERSION2, [NAME, "TikTok"]],
          [
            /headlesschrome(?:\/([\w\.]+)| )/i
            // Chrome Headless
          ],
          [VERSION2, [NAME, CHROME + " Headless"]],
          [
            / wv\).+(chrome)\/([\w\.]+)/i
            // Chrome WebView
          ],
          [[NAME, CHROME + " WebView"], VERSION2],
          [
            /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i
            // Android Browser
          ],
          [VERSION2, [NAME, "Android " + BROWSER]],
          [
            /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i
            // Chrome/OmniWeb/Arora/Tizen/Nokia
          ],
          [NAME, VERSION2],
          [
            /version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i
            // Mobile Safari
          ],
          [VERSION2, [NAME, "Mobile Safari"]],
          [
            /version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i
            // Safari & Safari Mobile
          ],
          [VERSION2, NAME],
          [
            /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i
            // Safari < 3.0
          ],
          [NAME, [VERSION2, strMapper, oldSafariMap]],
          [
            /(webkit|khtml)\/([\w\.]+)/i
          ],
          [NAME, VERSION2],
          [
            // Gecko based
            /(navigator|netscape\d?)\/([-\w\.]+)/i
            // Netscape
          ],
          [[NAME, "Netscape"], VERSION2],
          [
            /(wolvic|librewolf)\/([\w\.]+)/i
            // Wolvic/LibreWolf
          ],
          [NAME, VERSION2],
          [
            /mobile vr; rv:([\w\.]+)\).+firefox/i
            // Firefox Reality
          ],
          [VERSION2, [NAME, FIREFOX + " Reality"]],
          [
            /ekiohf.+(flow)\/([\w\.]+)/i,
            // Flow
            /(swiftfox)/i,
            // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror)[\/ ]?([\w\.\+]+)/i,
            // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
            // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(firefox)\/([\w\.]+)/i,
            // Other Firefox-based
            /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
            // Mozilla
            // Other
            /(amaya|dillo|doris|icab|ladybird|lynx|mosaic|netsurf|obigo|polaris|w3m|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
            // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Obigo/Mosaic/Go/ICE/UP.Browser/Ladybird
            /\b(links) \(([\w\.]+)/i
            // Links
          ],
          [NAME, [VERSION2, /_/g, "."]],
          [
            /(cobalt)\/([\w\.]+)/i
            // Cobalt
          ],
          [NAME, [VERSION2, /master.|lts./, ""]]
        ],
        cpu: [
          [
            /\b((amd|x|x86[-_]?|wow|win)64)\b/i
            // AMD64 (x64)
          ],
          [[ARCHITECTURE, "amd64"]],
          [
            /(ia32(?=;))/i,
            // IA32 (quicktime)
            /\b((i[346]|x)86)(pc)?\b/i
            // IA32 (x86)
          ],
          [[ARCHITECTURE, "ia32"]],
          [
            /\b(aarch64|arm(v?[89]e?l?|_?64))\b/i
            // ARM64
          ],
          [[ARCHITECTURE, "arm64"]],
          [
            /\b(arm(v[67])?ht?n?[fl]p?)\b/i
            // ARMHF
          ],
          [[ARCHITECTURE, "armhf"]],
          [
            // PocketPC mistakenly identified as PowerPC
            /( (ce|mobile); ppc;|\/[\w\.]+arm\b)/i
          ],
          [[ARCHITECTURE, "arm"]],
          [
            /((ppc|powerpc)(64)?)( mac|;|\))/i
            // PowerPC
          ],
          [[ARCHITECTURE, /ower/, EMPTY, lowerize]],
          [
            / sun4\w[;\)]/i
            // SPARC
          ],
          [[ARCHITECTURE, "sparc"]],
          [
            /\b(avr32|ia64(?=;)|68k(?=\))|\barm(?=v([1-7]|[5-7]1)l?|;|eabi)|(irix|mips|sparc)(64)?\b|pa-risc)/i
            // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
          ],
          [[ARCHITECTURE, lowerize]]
        ],
        device: [
          [
            //////////////////////////
            // MOBILES & TABLETS
            /////////////////////////
            // Samsung
            /\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i
          ],
          [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]],
          [
            /\b((?:s[cgp]h|gt|sm)-(?![lr])\w+|sc[g-]?[\d]+a?|galaxy nexus)/i,
            /samsung[- ]((?!sm-[lr])[-\w]+)/i,
            /sec-(sgh\w+)/i
          ],
          [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]],
          [
            // Apple
            /(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i
            // iPod/iPhone
          ],
          [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]],
          [
            /\((ipad);[-\w\),; ]+apple/i,
            // iPad
            /applecoremedia\/[\w\.]+ \((ipad)/i,
            /\b(ipad)\d\d?,\d\d?[;\]].+ios/i
          ],
          [MODEL, [VENDOR, APPLE], [TYPE, TABLET]],
          [
            /(macintosh);/i
          ],
          [MODEL, [VENDOR, APPLE]],
          [
            // Sharp
            /\b(sh-?[altvz]?\d\d[a-ekm]?)/i
          ],
          [MODEL, [VENDOR, SHARP], [TYPE, MOBILE]],
          [
            // Honor
            /\b((?:brt|eln|hey2?|gdi|jdn)-a?[lnw]09|(?:ag[rm]3?|jdn2|kob2)-a?[lw]0[09]hn)(?: bui|\)|;)/i
          ],
          [MODEL, [VENDOR, HONOR], [TYPE, TABLET]],
          [
            /honor([-\w ]+)[;\)]/i
          ],
          [MODEL, [VENDOR, HONOR], [TYPE, MOBILE]],
          [
            // Huawei
            /\b((?:ag[rs][2356]?k?|bah[234]?|bg[2o]|bt[kv]|cmr|cpn|db[ry]2?|jdn2|got|kob2?k?|mon|pce|scm|sht?|[tw]gr|vrd)-[ad]?[lw][0125][09]b?|605hw|bg2-u03|(?:gem|fdr|m2|ple|t1)-[7a]0[1-4][lu]|t1-a2[13][lw]|mediapad[\w\. ]*(?= bui|\)))\b(?!.+d\/s)/i
          ],
          [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]],
          [
            /(?:huawei)([-\w ]+)[;\)]/i,
            /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i
          ],
          [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]],
          [
            // Xiaomi
            /oid[^\)]+; (2[\dbc]{4}(182|283|rp\w{2})[cgl]|m2105k81a?c)(?: bui|\))/i,
            /\b((?:red)?mi[-_ ]?pad[\w- ]*)(?: bui|\))/i
            // Mi Pad tablets
          ],
          [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, TABLET]],
          [
            /\b(poco[\w ]+|m2\d{3}j\d\d[a-z]{2})(?: bui|\))/i,
            // Xiaomi POCO
            /\b; (\w+) build\/hm\1/i,
            // Xiaomi Hongmi 'numeric' models
            /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
            // Xiaomi Hongmi
            /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
            // Xiaomi Redmi
            /oid[^\)]+; (m?[12][0-389][01]\w{3,6}[c-y])( bui|; wv|\))/i,
            // Xiaomi Redmi 'numeric' models
            /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite|pro)?)(?: bui|\))/i,
            // Xiaomi Mi
            / ([\w ]+) miui\/v?\d/i
          ],
          [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, MOBILE]],
          [
            // OPPO
            /; (\w+) bui.+ oppo/i,
            /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i
          ],
          [MODEL, [VENDOR, OPPO], [TYPE, MOBILE]],
          [
            /\b(opd2(\d{3}a?))(?: bui|\))/i
          ],
          [MODEL, [VENDOR, strMapper, { "OnePlus": ["304", "403", "203"], "*": OPPO }], [TYPE, TABLET]],
          [
            // Vivo
            /vivo (\w+)(?: bui|\))/i,
            /\b(v[12]\d{3}\w?[at])(?: bui|;)/i
          ],
          [MODEL, [VENDOR, "Vivo"], [TYPE, MOBILE]],
          [
            // Realme
            /\b(rmx[1-3]\d{3})(?: bui|;|\))/i
          ],
          [MODEL, [VENDOR, "Realme"], [TYPE, MOBILE]],
          [
            // Motorola
            /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
            /\bmot(?:orola)?[- ](\w*)/i,
            /((?:moto(?! 360)[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
          ],
          [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]],
          [
            /\b(mz60\d|xoom[2 ]{0,2}) build\//i
          ],
          [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]],
          [
            // LG
            /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i
          ],
          [MODEL, [VENDOR, LG], [TYPE, TABLET]],
          [
            /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
            /\blg[-e;\/ ]+((?!browser|netcast|android tv|watch)\w+)/i,
            /\blg-?([\d\w]+) bui/i
          ],
          [MODEL, [VENDOR, LG], [TYPE, MOBILE]],
          [
            // Lenovo
            /(ideatab[-\w ]+|602lv|d-42a|a101lv|a2109a|a3500-hv|s[56]000|pb-6505[my]|tb-?x?\d{3,4}(?:f[cu]|xu|[av])|yt\d?-[jx]?\d+[lfmx])( bui|;|\)|\/)/i,
            /lenovo ?(b[68]0[08]0-?[hf]?|tab(?:[\w- ]+?)|tb[\w-]{6,7})( bui|;|\)|\/)/i
          ],
          [MODEL, [VENDOR, LENOVO], [TYPE, TABLET]],
          [
            // Nokia
            /(nokia) (t[12][01])/i
          ],
          [VENDOR, MODEL, [TYPE, TABLET]],
          [
            /(?:maemo|nokia).*(n900|lumia \d+|rm-\d+)/i,
            /nokia[-_ ]?(([-\w\. ]*))/i
          ],
          [[MODEL, /_/g, " "], [TYPE, MOBILE], [VENDOR, "Nokia"]],
          [
            // Google
            /(pixel (c|tablet))\b/i
            // Google Pixel C/Tablet
          ],
          [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]],
          [
            /droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i
            // Google Pixel
          ],
          [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]],
          [
            // Sony
            /droid.+; (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i
          ],
          [MODEL, [VENDOR, SONY], [TYPE, MOBILE]],
          [
            /sony tablet [ps]/i,
            /\b(?:sony)?sgp\w+(?: bui|\))/i
          ],
          [[MODEL, "Xperia Tablet"], [VENDOR, SONY], [TYPE, TABLET]],
          [
            // OnePlus
            / (kb2005|in20[12]5|be20[12][59])\b/i,
            /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i
          ],
          [MODEL, [VENDOR, ONEPLUS], [TYPE, MOBILE]],
          [
            // Amazon
            /(alexa)webm/i,
            /(kf[a-z]{2}wi|aeo(?!bc)\w\w)( bui|\))/i,
            // Kindle Fire without Silk / Echo Show
            /(kf[a-z]+)( bui|\)).+silk\//i
            // Kindle Fire HD
          ],
          [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]],
          [
            /((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i
            // Fire Phone
          ],
          [[MODEL, /(.+)/g, "Fire Phone $1"], [VENDOR, AMAZON], [TYPE, MOBILE]],
          [
            // BlackBerry
            /(playbook);[-\w\),; ]+(rim)/i
            // BlackBerry PlayBook
          ],
          [MODEL, VENDOR, [TYPE, TABLET]],
          [
            /\b((?:bb[a-f]|st[hv])100-\d)/i,
            /\(bb10; (\w+)/i
            // BlackBerry 10
          ],
          [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]],
          [
            // Asus
            /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i
          ],
          [MODEL, [VENDOR, ASUS], [TYPE, TABLET]],
          [
            / (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i
          ],
          [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]],
          [
            // HTC
            /(nexus 9)/i
            // HTC Nexus 9
          ],
          [MODEL, [VENDOR, "HTC"], [TYPE, TABLET]],
          [
            /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
            // HTC
            // ZTE
            /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
            /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i
            // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
          ],
          [VENDOR, [MODEL, /_/g, " "], [TYPE, MOBILE]],
          [
            // TCL
            /droid [\w\.]+; ((?:8[14]9[16]|9(?:0(?:48|60|8[01])|1(?:3[27]|66)|2(?:6[69]|9[56])|466))[gqswx])\w*(\)| bui)/i
          ],
          [MODEL, [VENDOR, "TCL"], [TYPE, TABLET]],
          [
            // itel
            /(itel) ((\w+))/i
          ],
          [[VENDOR, lowerize], MODEL, [TYPE, strMapper, { "tablet": ["p10001l", "w7001"], "*": "mobile" }]],
          [
            // Acer
            /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i
          ],
          [MODEL, [VENDOR, "Acer"], [TYPE, TABLET]],
          [
            // Meizu
            /droid.+; (m[1-5] note) bui/i,
            /\bmz-([-\w]{2,})/i
          ],
          [MODEL, [VENDOR, "Meizu"], [TYPE, MOBILE]],
          [
            // Ulefone
            /; ((?:power )?armor(?:[\w ]{0,8}))(?: bui|\))/i
          ],
          [MODEL, [VENDOR, "Ulefone"], [TYPE, MOBILE]],
          [
            // Energizer
            /; (energy ?\w+)(?: bui|\))/i,
            /; energizer ([\w ]+)(?: bui|\))/i
          ],
          [MODEL, [VENDOR, "Energizer"], [TYPE, MOBILE]],
          [
            // Cat
            /; cat (b35);/i,
            /; (b15q?|s22 flip|s48c|s62 pro)(?: bui|\))/i
          ],
          [MODEL, [VENDOR, "Cat"], [TYPE, MOBILE]],
          [
            // Smartfren
            /((?:new )?andromax[\w- ]+)(?: bui|\))/i
          ],
          [MODEL, [VENDOR, "Smartfren"], [TYPE, MOBILE]],
          [
            // Nothing
            /droid.+; (a(?:015|06[35]|142p?))/i
          ],
          [MODEL, [VENDOR, "Nothing"], [TYPE, MOBILE]],
          [
            // Archos
            /; (x67 5g|tikeasy \w+|ac[1789]\d\w+)( b|\))/i,
            /archos ?(5|gamepad2?|([\w ]*[t1789]|hello) ?\d+[\w ]*)( b|\))/i
          ],
          [MODEL, [VENDOR, "Archos"], [TYPE, TABLET]],
          [
            /archos ([\w ]+)( b|\))/i,
            /; (ac[3-6]\d\w{2,8})( b|\))/i
          ],
          [MODEL, [VENDOR, "Archos"], [TYPE, MOBILE]],
          [
            // MIXED
            /(imo) (tab \w+)/i,
            // IMO
            /(infinix) (x1101b?)/i
            // Infinix XPad
          ],
          [VENDOR, MODEL, [TYPE, TABLET]],
          [
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus(?! zenw)|dell|jolla|meizu|motorola|polytron|infinix|tecno|micromax|advan)[-_ ]?([-\w]*)/i,
            // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron/Infinix/Tecno/Micromax/Advan
            /; (hmd|imo) ([\w ]+?)(?: bui|\))/i,
            // HMD/IMO
            /(hp) ([\w ]+\w)/i,
            // HP iPAQ
            /(microsoft); (lumia[\w ]+)/i,
            // Microsoft Lumia
            /(lenovo)[-_ ]?([-\w ]+?)(?: bui|\)|\/)/i,
            // Lenovo
            /(oppo) ?([\w ]+) bui/i
            // OPPO
          ],
          [VENDOR, MODEL, [TYPE, MOBILE]],
          [
            /(kobo)\s(ereader|touch)/i,
            // Kobo
            /(hp).+(touchpad(?!.+tablet)|tablet)/i,
            // HP TouchPad
            /(kindle)\/([\w\.]+)/i,
            // Kindle
            /(nook)[\w ]+build\/(\w+)/i,
            // Nook
            /(dell) (strea[kpr\d ]*[\dko])/i,
            // Dell Streak
            /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
            // Le Pan Tablets
            /(trinity)[- ]*(t\d{3}) bui/i,
            // Trinity Tablets
            /(gigaset)[- ]+(q\w{1,9}) bui/i,
            // Gigaset Tablets
            /(vodafone) ([\w ]+)(?:\)| bui)/i
            // Vodafone
          ],
          [VENDOR, MODEL, [TYPE, TABLET]],
          [
            /(surface duo)/i
            // Surface Duo
          ],
          [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]],
          [
            /droid [\d\.]+; (fp\du?)(?: b|\))/i
            // Fairphone
          ],
          [MODEL, [VENDOR, "Fairphone"], [TYPE, MOBILE]],
          [
            /(u304aa)/i
            // AT&T
          ],
          [MODEL, [VENDOR, "AT&T"], [TYPE, MOBILE]],
          [
            /\bsie-(\w*)/i
            // Siemens
          ],
          [MODEL, [VENDOR, "Siemens"], [TYPE, MOBILE]],
          [
            /\b(rct\w+) b/i
            // RCA Tablets
          ],
          [MODEL, [VENDOR, "RCA"], [TYPE, TABLET]],
          [
            /\b(venue[\d ]{2,7}) b/i
            // Dell Venue Tablets
          ],
          [MODEL, [VENDOR, "Dell"], [TYPE, TABLET]],
          [
            /\b(q(?:mv|ta)\w+) b/i
            // Verizon Tablet
          ],
          [MODEL, [VENDOR, "Verizon"], [TYPE, TABLET]],
          [
            /\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i
            // Barnes & Noble Tablet
          ],
          [MODEL, [VENDOR, "Barnes & Noble"], [TYPE, TABLET]],
          [
            /\b(tm\d{3}\w+) b/i
          ],
          [MODEL, [VENDOR, "NuVision"], [TYPE, TABLET]],
          [
            /\b(k88) b/i
            // ZTE K Series Tablet
          ],
          [MODEL, [VENDOR, "ZTE"], [TYPE, TABLET]],
          [
            /\b(nx\d{3}j) b/i
            // ZTE Nubia
          ],
          [MODEL, [VENDOR, "ZTE"], [TYPE, MOBILE]],
          [
            /\b(gen\d{3}) b.+49h/i
            // Swiss GEN Mobile
          ],
          [MODEL, [VENDOR, "Swiss"], [TYPE, MOBILE]],
          [
            /\b(zur\d{3}) b/i
            // Swiss ZUR Tablet
          ],
          [MODEL, [VENDOR, "Swiss"], [TYPE, TABLET]],
          [
            /\b((zeki)?tb.*\b) b/i
            // Zeki Tablets
          ],
          [MODEL, [VENDOR, "Zeki"], [TYPE, TABLET]],
          [
            /\b([yr]\d{2}) b/i,
            /\b(dragon[- ]+touch |dt)(\w{5}) b/i
            // Dragon Touch Tablet
          ],
          [[VENDOR, "Dragon Touch"], MODEL, [TYPE, TABLET]],
          [
            /\b(ns-?\w{0,9}) b/i
            // Insignia Tablets
          ],
          [MODEL, [VENDOR, "Insignia"], [TYPE, TABLET]],
          [
            /\b((nxa|next)-?\w{0,9}) b/i
            // NextBook Tablets
          ],
          [MODEL, [VENDOR, "NextBook"], [TYPE, TABLET]],
          [
            /\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i
            // Voice Xtreme Phones
          ],
          [[VENDOR, "Voice"], MODEL, [TYPE, MOBILE]],
          [
            /\b(lvtel\-)?(v1[12]) b/i
            // LvTel Phones
          ],
          [[VENDOR, "LvTel"], MODEL, [TYPE, MOBILE]],
          [
            /\b(ph-1) /i
            // Essential PH-1
          ],
          [MODEL, [VENDOR, "Essential"], [TYPE, MOBILE]],
          [
            /\b(v(100md|700na|7011|917g).*\b) b/i
            // Envizen Tablets
          ],
          [MODEL, [VENDOR, "Envizen"], [TYPE, TABLET]],
          [
            /\b(trio[-\w\. ]+) b/i
            // MachSpeed Tablets
          ],
          [MODEL, [VENDOR, "MachSpeed"], [TYPE, TABLET]],
          [
            /\btu_(1491) b/i
            // Rotor Tablets
          ],
          [MODEL, [VENDOR, "Rotor"], [TYPE, TABLET]],
          [
            /((?:tegranote|shield t(?!.+d tv))[\w- ]*?)(?: b|\))/i
            // Nvidia Tablets
          ],
          [MODEL, [VENDOR, NVIDIA], [TYPE, TABLET]],
          [
            /(sprint) (\w+)/i
            // Sprint Phones
          ],
          [VENDOR, MODEL, [TYPE, MOBILE]],
          [
            /(kin\.[onetw]{3})/i
            // Microsoft Kin
          ],
          [[MODEL, /\./g, " "], [VENDOR, MICROSOFT], [TYPE, MOBILE]],
          [
            /droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i
            // Zebra
          ],
          [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]],
          [
            /droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i
          ],
          [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]],
          [
            ///////////////////
            // SMARTTVS
            ///////////////////
            /smart-tv.+(samsung)/i
            // Samsung
          ],
          [VENDOR, [TYPE, SMARTTV]],
          [
            /hbbtv.+maple;(\d+)/i
          ],
          [[MODEL, /^/, "SmartTV"], [VENDOR, SAMSUNG], [TYPE, SMARTTV]],
          [
            /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i
            // LG SmartTV
          ],
          [[VENDOR, LG], [TYPE, SMARTTV]],
          [
            /(apple) ?tv/i
            // Apple TV
          ],
          [VENDOR, [MODEL, APPLE + " TV"], [TYPE, SMARTTV]],
          [
            /crkey/i
            // Google Chromecast
          ],
          [[MODEL, CHROME + "cast"], [VENDOR, GOOGLE], [TYPE, SMARTTV]],
          [
            /droid.+aft(\w+)( bui|\))/i
            // Fire TV
          ],
          [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]],
          [
            /(shield \w+ tv)/i
            // Nvidia Shield TV
          ],
          [MODEL, [VENDOR, NVIDIA], [TYPE, SMARTTV]],
          [
            /\(dtv[\);].+(aquos)/i,
            /(aquos-tv[\w ]+)\)/i
            // Sharp
          ],
          [MODEL, [VENDOR, SHARP], [TYPE, SMARTTV]],
          [
            /(bravia[\w ]+)( bui|\))/i
            // Sony
          ],
          [MODEL, [VENDOR, SONY], [TYPE, SMARTTV]],
          [
            /(mi(tv|box)-?\w+) bui/i
            // Xiaomi
          ],
          [MODEL, [VENDOR, XIAOMI], [TYPE, SMARTTV]],
          [
            /Hbbtv.*(technisat) (.*);/i
            // TechniSAT
          ],
          [VENDOR, MODEL, [TYPE, SMARTTV]],
          [
            /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,
            // Roku
            /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i
            // HbbTV devices
          ],
          [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]],
          [
            // SmartTV from Unidentified Vendors
            /droid.+; ([\w- ]+) (?:android tv|smart[- ]?tv)/i
          ],
          [MODEL, [TYPE, SMARTTV]],
          [
            /\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i
          ],
          [[TYPE, SMARTTV]],
          [
            ///////////////////
            // CONSOLES
            ///////////////////
            /(ouya)/i,
            // Ouya
            /(nintendo) ([wids3utch]+)/i
            // Nintendo
          ],
          [VENDOR, MODEL, [TYPE, CONSOLE]],
          [
            /droid.+; (shield)( bui|\))/i
            // Nvidia Portable
          ],
          [MODEL, [VENDOR, NVIDIA], [TYPE, CONSOLE]],
          [
            /(playstation \w+)/i
            // Playstation
          ],
          [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]],
          [
            /\b(xbox(?: one)?(?!; xbox))[\); ]/i
            // Microsoft Xbox
          ],
          [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]],
          [
            ///////////////////
            // WEARABLES
            ///////////////////
            /\b(sm-[lr]\d\d[0156][fnuw]?s?|gear live)\b/i
            // Samsung Galaxy Watch
          ],
          [MODEL, [VENDOR, SAMSUNG], [TYPE, WEARABLE]],
          [
            /((pebble))app/i,
            // Pebble
            /(asus|google|lg|oppo) ((pixel |zen)?watch[\w ]*)( bui|\))/i
            // Asus ZenWatch / LG Watch / Pixel Watch
          ],
          [VENDOR, MODEL, [TYPE, WEARABLE]],
          [
            /(ow(?:19|20)?we?[1-3]{1,3})/i
            // Oppo Watch
          ],
          [MODEL, [VENDOR, OPPO], [TYPE, WEARABLE]],
          [
            /(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i
            // Apple Watch
          ],
          [MODEL, [VENDOR, APPLE], [TYPE, WEARABLE]],
          [
            /(opwwe\d{3})/i
            // OnePlus Watch
          ],
          [MODEL, [VENDOR, ONEPLUS], [TYPE, WEARABLE]],
          [
            /(moto 360)/i
            // Motorola 360
          ],
          [MODEL, [VENDOR, MOTOROLA], [TYPE, WEARABLE]],
          [
            /(smartwatch 3)/i
            // Sony SmartWatch
          ],
          [MODEL, [VENDOR, SONY], [TYPE, WEARABLE]],
          [
            /(g watch r)/i
            // LG G Watch R
          ],
          [MODEL, [VENDOR, LG], [TYPE, WEARABLE]],
          [
            /droid.+; (wt63?0{2,3})\)/i
          ],
          [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]],
          [
            ///////////////////
            // XR
            ///////////////////
            /droid.+; (glass) \d/i
            // Google Glass
          ],
          [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]],
          [
            /(pico) (4|neo3(?: link|pro)?)/i
            // Pico
          ],
          [VENDOR, MODEL, [TYPE, WEARABLE]],
          [
            /; (quest( \d| pro)?)/i
            // Oculus Quest
          ],
          [MODEL, [VENDOR, FACEBOOK], [TYPE, WEARABLE]],
          [
            ///////////////////
            // EMBEDDED
            ///////////////////
            /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i
            // Tesla
          ],
          [VENDOR, [TYPE, EMBEDDED]],
          [
            /(aeobc)\b/i
            // Echo Dot
          ],
          [MODEL, [VENDOR, AMAZON], [TYPE, EMBEDDED]],
          [
            /(homepod).+mac os/i
            // Apple HomePod
          ],
          [MODEL, [VENDOR, APPLE], [TYPE, EMBEDDED]],
          [
            /windows iot/i
          ],
          [[TYPE, EMBEDDED]],
          [
            ////////////////////
            // MIXED (GENERIC)
            ///////////////////
            /droid .+?; ([^;]+?)(?: bui|; wv\)|\) applew).+? mobile safari/i
            // Android Phones from Unidentified Vendors
          ],
          [MODEL, [TYPE, MOBILE]],
          [
            /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i
            // Android Tablets from Unidentified Vendors
          ],
          [MODEL, [TYPE, TABLET]],
          [
            /\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i
            // Unidentifiable Tablet
          ],
          [[TYPE, TABLET]],
          [
            /(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i
            // Unidentifiable Mobile
          ],
          [[TYPE, MOBILE]],
          [
            /droid .+?; ([\w\. -]+)( bui|\))/i
            // Generic Android Device
          ],
          [MODEL, [VENDOR, "Generic"]]
        ],
        engine: [
          [
            /windows.+ edge\/([\w\.]+)/i
            // EdgeHTML
          ],
          [VERSION2, [NAME, EDGE + "HTML"]],
          [
            /(arkweb)\/([\w\.]+)/i
            // ArkWeb
          ],
          [NAME, VERSION2],
          [
            /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i
            // Blink
          ],
          [VERSION2, [NAME, "Blink"]],
          [
            /(presto)\/([\w\.]+)/i,
            // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna|servo)\/([\w\.]+)/i,
            // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna/Servo
            /ekioh(flow)\/([\w\.]+)/i,
            // Flow
            /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,
            // KHTML/Tasman/Links
            /(icab)[\/ ]([23]\.[\d\.]+)/i,
            // iCab
            /\b(libweb)/i
            // LibWeb
          ],
          [NAME, VERSION2],
          [
            /ladybird\//i
          ],
          [[NAME, "LibWeb"]],
          [
            /rv\:([\w\.]{1,9})\b.+(gecko)/i
            // Gecko
          ],
          [VERSION2, NAME]
        ],
        os: [
          [
            // Windows
            /microsoft (windows) (vista|xp)/i
            // Windows (iTunes)
          ],
          [NAME, VERSION2],
          [
            /(windows (?:phone(?: os)?|mobile|iot))[\/ ]?([\d\.\w ]*)/i
            // Windows Phone
          ],
          [NAME, [VERSION2, strMapper, windowsVersionMap]],
          [
            /windows nt 6\.2; (arm)/i,
            // Windows RT
            /windows[\/ ]([ntce\d\. ]+\w)(?!.+xbox)/i,
            /(?:win(?=3|9|n)|win 9x )([nt\d\.]+)/i
          ],
          [[VERSION2, strMapper, windowsVersionMap], [NAME, "Windows"]],
          [
            // iOS/macOS
            /[adehimnop]{4,7}\b(?:.*os ([\w]+) like mac|; opera)/i,
            // iOS
            /(?:ios;fbsv\/|iphone.+ios[\/ ])([\d\.]+)/i,
            /cfnetwork\/.+darwin/i
          ],
          [[VERSION2, /_/g, "."], [NAME, "iOS"]],
          [
            /(mac os x) ?([\w\. ]*)/i,
            /(macintosh|mac_powerpc\b)(?!.+haiku)/i
            // Mac OS
          ],
          [[NAME, MAC_OS], [VERSION2, /_/g, "."]],
          [
            // Mobile OSes
            /droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i
            // Android-x86/HarmonyOS
          ],
          [VERSION2, NAME],
          [
            /(ubuntu) ([\w\.]+) like android/i
            // Ubuntu Touch
          ],
          [[NAME, /(.+)/, "$1 Touch"], VERSION2],
          [
            // Android/Blackberry/WebOS/QNX/Bada/RIM/KaiOS/Maemo/MeeGo/S40/Sailfish OS/OpenHarmony/Tizen
            /(android|bada|blackberry|kaios|maemo|meego|openharmony|qnx|rim tablet os|sailfish|series40|symbian|tizen|webos)\w*[-\/; ]?([\d\.]*)/i
          ],
          [NAME, VERSION2],
          [
            /\(bb(10);/i
            // BlackBerry 10
          ],
          [VERSION2, [NAME, BLACKBERRY]],
          [
            /(?:symbian ?os|symbos|s60(?=;)|series ?60)[-\/ ]?([\w\.]*)/i
            // Symbian
          ],
          [VERSION2, [NAME, "Symbian"]],
          [
            /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i
            // Firefox OS
          ],
          [VERSION2, [NAME, FIREFOX + " OS"]],
          [
            /web0s;.+rt(tv)/i,
            /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i
            // WebOS
          ],
          [VERSION2, [NAME, "webOS"]],
          [
            /watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i
            // watchOS
          ],
          [VERSION2, [NAME, "watchOS"]],
          [
            // Google Chromecast
            /crkey\/([\d\.]+)/i
            // Google Chromecast
          ],
          [VERSION2, [NAME, CHROME + "cast"]],
          [
            /(cros) [\w]+(?:\)| ([\w\.]+)\b)/i
            // Chromium OS
          ],
          [[NAME, CHROMIUM_OS], VERSION2],
          [
            // Smart TVs
            /panasonic;(viera)/i,
            // Panasonic Viera
            /(netrange)mmh/i,
            // Netrange
            /(nettv)\/(\d+\.[\w\.]+)/i,
            // NetTV
            // Console
            /(nintendo|playstation) ([wids345portablevuch]+)/i,
            // Nintendo/Playstation
            /(xbox); +xbox ([^\);]+)/i,
            // Microsoft Xbox (360, One, X, S, Series X, Series S)
            // Other
            /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
            // Joli/Palm
            /(mint)[\/\(\) ]?(\w*)/i,
            // Mint
            /(mageia|vectorlinux)[; ]/i,
            // Mageia/VectorLinux
            /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
            // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
            /(hurd|linux)(?: arm\w*| x86\w*| ?)([\w\.]*)/i,
            // Hurd/Linux
            /(gnu) ?([\w\.]*)/i,
            // GNU
            /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
            // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
            /(haiku) (\w+)/i
            // Haiku
          ],
          [NAME, VERSION2],
          [
            /(sunos) ?([\w\.\d]*)/i
            // Solaris
          ],
          [[NAME, "Solaris"], VERSION2],
          [
            /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
            // Solaris
            /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
            // AIX
            /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i,
            // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX/SerenityOS
            /(unix) ?([\w\.]*)/i
            // UNIX
          ],
          [NAME, VERSION2]
        ]
      };
      var UAParser2 = function(ua, extensions) {
        if (typeof ua === OBJ_TYPE) {
          extensions = ua;
          ua = undefined2;
        }
        if (!(this instanceof UAParser2)) {
          return new UAParser2(ua, extensions).getResult();
        }
        var _navigator = typeof window2 !== UNDEF_TYPE && window2.navigator ? window2.navigator : undefined2;
        var _ua = ua || (_navigator && _navigator.userAgent ? _navigator.userAgent : EMPTY);
        var _uach = _navigator && _navigator.userAgentData ? _navigator.userAgentData : undefined2;
        var _rgxmap = extensions ? extend(regexes, extensions) : regexes;
        var _isSelfNav = _navigator && _navigator.userAgent == _ua;
        this.getBrowser = function() {
          var _browser = {};
          _browser[NAME] = undefined2;
          _browser[VERSION2] = undefined2;
          rgxMapper.call(_browser, _ua, _rgxmap.browser);
          _browser[MAJOR] = majorize(_browser[VERSION2]);
          if (_isSelfNav && _navigator && _navigator.brave && typeof _navigator.brave.isBrave == FUNC_TYPE) {
            _browser[NAME] = "Brave";
          }
          return _browser;
        };
        this.getCPU = function() {
          var _cpu = {};
          _cpu[ARCHITECTURE] = undefined2;
          rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
          return _cpu;
        };
        this.getDevice = function() {
          var _device = {};
          _device[VENDOR] = undefined2;
          _device[MODEL] = undefined2;
          _device[TYPE] = undefined2;
          rgxMapper.call(_device, _ua, _rgxmap.device);
          if (_isSelfNav && !_device[TYPE] && _uach && _uach.mobile) {
            _device[TYPE] = MOBILE;
          }
          if (_isSelfNav && _device[MODEL] == "Macintosh" && _navigator && typeof _navigator.standalone !== UNDEF_TYPE && _navigator.maxTouchPoints && _navigator.maxTouchPoints > 2) {
            _device[MODEL] = "iPad";
            _device[TYPE] = TABLET;
          }
          return _device;
        };
        this.getEngine = function() {
          var _engine = {};
          _engine[NAME] = undefined2;
          _engine[VERSION2] = undefined2;
          rgxMapper.call(_engine, _ua, _rgxmap.engine);
          return _engine;
        };
        this.getOS = function() {
          var _os = {};
          _os[NAME] = undefined2;
          _os[VERSION2] = undefined2;
          rgxMapper.call(_os, _ua, _rgxmap.os);
          if (_isSelfNav && !_os[NAME] && _uach && _uach.platform && _uach.platform != "Unknown") {
            _os[NAME] = _uach.platform.replace(/chrome os/i, CHROMIUM_OS).replace(/macos/i, MAC_OS);
          }
          return _os;
        };
        this.getResult = function() {
          return {
            ua: this.getUA(),
            browser: this.getBrowser(),
            engine: this.getEngine(),
            os: this.getOS(),
            device: this.getDevice(),
            cpu: this.getCPU()
          };
        };
        this.getUA = function() {
          return _ua;
        };
        this.setUA = function(ua2) {
          _ua = typeof ua2 === STR_TYPE && ua2.length > UA_MAX_LENGTH ? trim(ua2, UA_MAX_LENGTH) : ua2;
          return this;
        };
        this.setUA(_ua);
        return this;
      };
      UAParser2.VERSION = LIBVERSION;
      UAParser2.BROWSER = enumerize([NAME, VERSION2, MAJOR]);
      UAParser2.CPU = enumerize([ARCHITECTURE]);
      UAParser2.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
      UAParser2.ENGINE = UAParser2.OS = enumerize([NAME, VERSION2]);
      if (typeof exports !== UNDEF_TYPE) {
        if (typeof module !== UNDEF_TYPE && module.exports) {
          exports = module.exports = UAParser2;
        }
        exports.UAParser = UAParser2;
      } else {
        if (typeof define === FUNC_TYPE && define.amd) {
          define(function() {
            return UAParser2;
          });
        } else if (typeof window2 !== UNDEF_TYPE) {
          window2.UAParser = UAParser2;
        }
      }
      var $3 = typeof window2 !== UNDEF_TYPE && (window2.jQuery || window2.Zepto);
      if ($3 && !$3.ua) {
        var parser = new UAParser2();
        $3.ua = parser.getResult();
        $3.ua.get = function() {
          return parser.getUA();
        };
        $3.ua.set = function(ua) {
          parser.setUA(ua);
          var result = parser.getResult();
          for (var prop in result) {
            $3.ua[prop] = result[prop];
          }
        };
      }
    })(typeof window === "object" ? window : exports);
  }
});

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/is.js
function isTypeof(value, type) {
  return typeof value === type;
}
function isToString(value, type) {
  return Object.prototype.toString.call(value) === `[object ${type}]`;
}
function isInstanceOf(value, reference) {
  try {
    return value instanceof reference;
  } catch (err) {
    return false;
  }
}
var isUndefined = ((value) => isTypeof(value, "undefined"));
var isNull = ((value) => isTypeof(value, "null"));
var isString = ((value) => isTypeof(value, "string"));
var isNumber = ((value) => isTypeof(value, "number") && !isNaN(value) || isTypeof(value, "bigint"));
var isInt = ((value) => isNumber(value) && Number.isInteger(value));
var isBoolean = ((value) => isTypeof(value, "boolean"));
var isSymbol = ((value) => isTypeof(value, "symbol"));
var isObject = ((value) => !isNull(value) && isTypeof(value, "object"));
var isFunction = ((value) => isTypeof(value, "function"));
var isArray = ((value) => isToString(value, "Array"));
var isRegExp = ((value) => isToString(value, "RegExp"));
var isThenable = ((value) => isFunction(value === null || value === void 0 ? void 0 : value.then));
var isPrimitive = ((value) => !isObject(value) && !isFunction(value));
var isEventDefined = typeof Event !== "undefined";
var isEvent = ((value) => isEventDefined && isInstanceOf(value, Event));
var isErrorDefined = typeof Error !== "undefined";
var isError = ((value) => isErrorDefined && isInstanceOf(value, Error));
var isErrorEvent = ((value) => isToString(value, "ErrorEvent"));
var isDomError = ((value) => isToString(value, "DOMError"));
var isDomException = ((value) => isToString(value, "DOMException"));
var isElementDefined = typeof Element !== "undefined";
var isElement = ((value) => isElementDefined && isInstanceOf(value, Element));
var isMapDefined = typeof Map !== "undefined";
var isMap = ((value) => isMapDefined && isInstanceOf(value, Map));
var isSyntheticEvent = ((value) => isObject(value) && "nativeEvent" in value && "preventDefault" in value && "stopPropagation" in value);
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArray(value) || isString(value)) {
    return value.length === 0;
  }
  if (isObject(value)) {
    return Object.keys(value).length === 0;
  }
  return false;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/deepEqual.js
function deepEqual(a3, b3) {
  if (a3 === b3) {
    return true;
  }
  if (isTypeof(a3, "number") && isNaN(a3)) {
    return isTypeof(b3, "number") && isNaN(b3);
  }
  const aIsArray = isArray(a3);
  const bIsArray = isArray(b3);
  if (aIsArray !== bIsArray) {
    return false;
  }
  if (aIsArray && bIsArray) {
    const length = a3.length;
    if (length !== b3.length) {
      return false;
    }
    for (let idx = length; idx-- !== 0; ) {
      if (!deepEqual(a3[idx], b3[idx])) {
        return false;
      }
    }
    return true;
  }
  const aIsObject = isObject(a3);
  const bIsObject = isObject(b3);
  if (aIsObject !== bIsObject) {
    return false;
  }
  if (a3 && b3 && aIsObject && bIsObject) {
    const aKeys = Object.keys(a3);
    const bKeys = Object.keys(b3);
    const aLength = aKeys.length;
    const bLength = bKeys.length;
    if (aLength !== bLength) {
      return false;
    }
    for (let aKey of aKeys) {
      if (!bKeys.includes(aKey)) {
        return false;
      }
    }
    for (let aKey of aKeys) {
      if (!deepEqual(a3[aKey], b3[aKey])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/date.js
function dateNow() {
  return Date.now();
}
function getCurrentTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function timestampToIsoString(value) {
  return new Date(value).toISOString();
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/logLevels.js
var LogLevel;
(function(LogLevel2) {
  LogLevel2["TRACE"] = "trace";
  LogLevel2["DEBUG"] = "debug";
  LogLevel2["INFO"] = "info";
  LogLevel2["LOG"] = "log";
  LogLevel2["WARN"] = "warn";
  LogLevel2["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
var defaultLogLevel = LogLevel.LOG;
var allLogLevels = [
  LogLevel.TRACE,
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.LOG,
  LogLevel.WARN,
  LogLevel.ERROR
];

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/noop.js
function noop() {
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/promiseBuffer.js
function createPromiseBuffer(options) {
  const { size, concurrency } = options;
  const buffer = [];
  let inProgress = 0;
  const work = () => {
    if (inProgress < concurrency && buffer.length) {
      const { producer, resolve, reject } = buffer.shift();
      inProgress++;
      producer().then((result) => {
        inProgress--;
        work();
        resolve(result);
      }, (reason) => {
        inProgress--;
        work();
        reject(reason);
      });
    }
  };
  const add = (promiseProducer) => {
    if (buffer.length + inProgress >= size) {
      throw new Error("Task buffer full");
    }
    return new Promise((resolve, reject) => {
      buffer.push({
        producer: promiseProducer,
        resolve,
        reject
      });
      work();
    });
  };
  return {
    add
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/shortId.js
var alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
function genShortID(length = 10) {
  return Array.from(Array(length)).map(() => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/globalObject/globalObject.js
var globalObject = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : void 0;

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/sourceMaps.js
function getBundleId(appName) {
  return globalObject === null || globalObject === void 0 ? void 0 : globalObject[`__faroBundleId_${appName}`];
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/json.js
function getCircularDependencyReplacer() {
  const valueSeen = /* @__PURE__ */ new WeakSet();
  return function(_key, value) {
    if (isObject(value) && value !== null) {
      if (valueSeen.has(value)) {
        return null;
      }
      valueSeen.add(value);
    }
    return value;
  };
}
function stringifyExternalJson(json = {}) {
  return JSON.stringify(json !== null && json !== void 0 ? json : {}, getCircularDependencyReplacer());
}
function stringifyObjectValues(obj = {}) {
  const o3 = {};
  for (const [key, value] of Object.entries(obj)) {
    o3[key] = isObject(value) && value !== null ? stringifyExternalJson(value) : String(value);
  }
  return o3;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/utils/reactive.js
var Observable = class _Observable {
  constructor() {
    this.subscribers = [];
  }
  subscribe(subscriber) {
    this.subscribers.push(subscriber);
    return {
      unsubscribe: () => this.unsubscribe(subscriber)
    };
  }
  unsubscribe(subscriber) {
    this.subscribers = this.subscribers.filter((sub) => sub !== subscriber);
  }
  notify(value) {
    this.subscribers.forEach((subscriber) => subscriber(value));
  }
  first() {
    const result = new _Observable();
    const internalSubscriber = (data) => {
      result.notify(data);
      subscription.unsubscribe();
    };
    const subscription = this.subscribe(internalSubscriber);
    const resultUnsubscribeFn = result.unsubscribe.bind(result);
    return this.withUnsubscribeOverride(result, resultUnsubscribeFn, internalSubscriber);
  }
  takeWhile(predicate) {
    const result = new _Observable();
    const internalSubscriber = (value) => {
      if (predicate(value)) {
        result.notify(value);
      } else {
        result.unsubscribe(internalSubscriber);
      }
    };
    this.subscribe(internalSubscriber);
    const resultUnsubscribeFn = result.unsubscribe.bind(result);
    return this.withUnsubscribeOverride(result, resultUnsubscribeFn, internalSubscriber);
  }
  filter(predicate) {
    const result = new _Observable();
    const internalSubscriber = (value) => {
      if (predicate(value)) {
        result.notify(value);
      }
    };
    this.subscribe(internalSubscriber);
    const resultUnsubscribeFn = result.unsubscribe.bind(result);
    return this.withUnsubscribeOverride(result, resultUnsubscribeFn, internalSubscriber);
  }
  merge(...observables) {
    const mergerObservable = new _Observable();
    const subscriptions = [];
    observables.forEach((observable) => {
      const subscription = observable.subscribe((value) => {
        mergerObservable.notify(value);
      });
      subscriptions.push(subscription);
    });
    const originalUnsubscribeAll = mergerObservable.unsubscribeAll.bind(mergerObservable);
    mergerObservable.unsubscribe = () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      originalUnsubscribeAll();
    };
    return mergerObservable;
  }
  withUnsubscribeOverride(observable, resultUnsubscribeFn, internalSubscriber) {
    observable.unsubscribe = (subscriber) => {
      resultUnsubscribeFn(subscriber);
      this.unsubscribe(internalSubscriber);
    };
    return observable;
  }
  unsubscribeAll() {
    this.subscribers = [];
  }
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/transports/batchExecutor.js
var DEFAULT_SEND_TIMEOUT_MS = 250;
var DEFAULT_BATCH_ITEM_LIMIT = 50;
var BatchExecutor = class {
  constructor(sendFn, options) {
    var _a, _b;
    this.signalBuffer = [];
    this.itemLimit = (_a = options === null || options === void 0 ? void 0 : options.itemLimit) !== null && _a !== void 0 ? _a : DEFAULT_BATCH_ITEM_LIMIT;
    this.sendTimeout = (_b = options === null || options === void 0 ? void 0 : options.sendTimeout) !== null && _b !== void 0 ? _b : DEFAULT_SEND_TIMEOUT_MS;
    this.paused = (options === null || options === void 0 ? void 0 : options.paused) || false;
    this.sendFn = sendFn;
    this.flushInterval = -1;
    if (!this.paused) {
      this.start();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });
  }
  addItem(item) {
    if (this.paused) {
      return;
    }
    this.signalBuffer.push(item);
    if (this.signalBuffer.length >= this.itemLimit) {
      this.flush();
    }
  }
  start() {
    this.paused = false;
    if (this.sendTimeout > 0) {
      this.flushInterval = window.setInterval(() => this.flush(), this.sendTimeout);
    }
  }
  pause() {
    this.paused = true;
    clearInterval(this.flushInterval);
  }
  groupItems(items) {
    const itemMap = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      const metaKey = JSON.stringify(item.meta);
      let currentItems = itemMap.get(metaKey);
      if (currentItems === void 0) {
        currentItems = [item];
      } else {
        currentItems = [...currentItems, item];
      }
      itemMap.set(metaKey, currentItems);
    });
    return Array.from(itemMap.values());
  }
  flush() {
    if (this.paused || this.signalBuffer.length === 0) {
      return;
    }
    const itemGroups = this.groupItems(this.signalBuffer);
    itemGroups.forEach(this.sendFn);
    this.signalBuffer = [];
  }
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/transports/const.js
var TransportItemType;
(function(TransportItemType2) {
  TransportItemType2["EXCEPTION"] = "exception";
  TransportItemType2["LOG"] = "log";
  TransportItemType2["MEASUREMENT"] = "measurement";
  TransportItemType2["TRACE"] = "trace";
  TransportItemType2["EVENT"] = "event";
})(TransportItemType || (TransportItemType = {}));
var transportItemTypeToBodyKey = {
  [TransportItemType.EXCEPTION]: "exceptions",
  [TransportItemType.LOG]: "logs",
  [TransportItemType.MEASUREMENT]: "measurements",
  [TransportItemType.TRACE]: "traces",
  [TransportItemType.EVENT]: "events"
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/transports/initialize.js
function initializeTransports(unpatchedConsole2, internalLogger2, config, metas) {
  var _a;
  internalLogger2.debug("Initializing transports");
  const transports = [];
  let paused = config.paused;
  let beforeSendHooks = [];
  const add = (...newTransports) => {
    internalLogger2.debug("Adding transports");
    newTransports.forEach((newTransport) => {
      internalLogger2.debug(`Adding "${newTransport.name}" transport`);
      const exists = transports.some((existingTransport) => existingTransport === newTransport);
      if (exists) {
        internalLogger2.warn(`Transport ${newTransport.name} is already added`);
        return;
      }
      newTransport.unpatchedConsole = unpatchedConsole2;
      newTransport.internalLogger = internalLogger2;
      newTransport.config = config;
      newTransport.metas = metas;
      transports.push(newTransport);
    });
  };
  const addBeforeSendHooks = (...newBeforeSendHooks) => {
    internalLogger2.debug("Adding beforeSendHooks\n", beforeSendHooks);
    newBeforeSendHooks.forEach((beforeSendHook) => {
      if (beforeSendHook) {
        beforeSendHooks.push(beforeSendHook);
      }
    });
  };
  const applyBeforeSendHooks = (items) => {
    let filteredItems = items;
    for (const hook of beforeSendHooks) {
      const modified = filteredItems.map(hook).filter(Boolean);
      if (modified.length === 0) {
        return [];
      }
      filteredItems = sanitizeItems(modified, config);
    }
    return filteredItems;
  };
  const batchedSend = (items) => {
    const filteredItems = applyBeforeSendHooks(items);
    if (filteredItems.length === 0) {
      return;
    }
    for (const transport of transports) {
      internalLogger2.debug(`Transporting item using ${transport.name}
`, filteredItems);
      if (transport.isBatched()) {
        transport.send(filteredItems);
      }
    }
  };
  const instantSend = (item) => {
    var _a2, _b;
    if (((_a2 = config.batching) === null || _a2 === void 0 ? void 0 : _a2.enabled) && transports.every((transport) => transport.isBatched())) {
      return;
    }
    const [filteredItem] = applyBeforeSendHooks([item]);
    if (filteredItem === void 0) {
      return;
    }
    for (const transport of transports) {
      internalLogger2.debug(`Transporting item using ${transport.name}
`, filteredItem);
      if (!transport.isBatched()) {
        transport.send(filteredItem);
      } else if (!((_b = config.batching) === null || _b === void 0 ? void 0 : _b.enabled)) {
        transport.send([filteredItem]);
      }
    }
  };
  let batchExecutor;
  if ((_a = config.batching) === null || _a === void 0 ? void 0 : _a.enabled) {
    batchExecutor = new BatchExecutor(batchedSend, {
      sendTimeout: config.batching.sendTimeout,
      itemLimit: config.batching.itemLimit,
      paused
    });
  }
  const execute = (item) => {
    var _a2;
    if (paused) {
      return;
    }
    if ((_a2 = config.batching) === null || _a2 === void 0 ? void 0 : _a2.enabled) {
      batchExecutor === null || batchExecutor === void 0 ? void 0 : batchExecutor.addItem(item);
    }
    instantSend(item);
  };
  const getBeforeSendHooks = () => [...beforeSendHooks];
  const isPaused = () => paused;
  const pause = () => {
    internalLogger2.debug("Pausing transports");
    batchExecutor === null || batchExecutor === void 0 ? void 0 : batchExecutor.pause();
    paused = true;
  };
  const remove = (...transportsToRemove) => {
    internalLogger2.debug("Removing transports");
    transportsToRemove.forEach((transportToRemove) => {
      internalLogger2.debug(`Removing "${transportToRemove.name}" transport`);
      const existingTransportIndex = transports.indexOf(transportToRemove);
      if (existingTransportIndex === -1) {
        internalLogger2.warn(`Transport "${transportToRemove.name}" is not added`);
        return;
      }
      transports.splice(existingTransportIndex, 1);
    });
  };
  const removeBeforeSendHooks = (...beforeSendHooksToRemove) => {
    beforeSendHooks.filter((beforeSendHook) => !beforeSendHooksToRemove.includes(beforeSendHook));
  };
  const unpause = () => {
    internalLogger2.debug("Unpausing transports");
    batchExecutor === null || batchExecutor === void 0 ? void 0 : batchExecutor.start();
    paused = false;
  };
  return {
    add,
    addBeforeSendHooks,
    getBeforeSendHooks,
    execute,
    isPaused,
    pause,
    remove,
    removeBeforeSendHooks,
    get transports() {
      return [...transports];
    },
    unpause
  };
}
function sanitizeItems(filteredItems, config) {
  if (config.preserveOriginalError) {
    for (const item of filteredItems) {
      if (item.type === TransportItemType.EXCEPTION) {
        delete item.payload.originalError;
      }
    }
  }
  return filteredItems;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/internalLogger/const.js
var InternalLoggerLevel;
(function(InternalLoggerLevel2) {
  InternalLoggerLevel2[InternalLoggerLevel2["OFF"] = 0] = "OFF";
  InternalLoggerLevel2[InternalLoggerLevel2["ERROR"] = 1] = "ERROR";
  InternalLoggerLevel2[InternalLoggerLevel2["WARN"] = 2] = "WARN";
  InternalLoggerLevel2[InternalLoggerLevel2["INFO"] = 3] = "INFO";
  InternalLoggerLevel2[InternalLoggerLevel2["VERBOSE"] = 4] = "VERBOSE";
})(InternalLoggerLevel || (InternalLoggerLevel = {}));
var defaultInternalLoggerPrefix = "Faro";
var defaultInternalLogger = {
  debug: noop,
  error: noop,
  info: noop,
  prefix: defaultInternalLoggerPrefix,
  warn: noop
};
var defaultInternalLoggerLevel = InternalLoggerLevel.ERROR;

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/unpatchedConsole/const.js
var defaultUnpatchedConsole = Object.assign({}, console);

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/unpatchedConsole/initialize.js
var unpatchedConsole = defaultUnpatchedConsole;
function initializeUnpatchedConsole(config) {
  var _a;
  unpatchedConsole = (_a = config.unpatchedConsole) !== null && _a !== void 0 ? _a : unpatchedConsole;
  return unpatchedConsole;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/internalLogger/createInternalLogger.js
function createInternalLogger(unpatchedConsole2 = defaultUnpatchedConsole, internalLoggerLevel = defaultInternalLoggerLevel) {
  const internalLogger2 = defaultInternalLogger;
  if (internalLoggerLevel > InternalLoggerLevel.OFF) {
    internalLogger2.error = internalLoggerLevel >= InternalLoggerLevel.ERROR ? function(...args) {
      unpatchedConsole2.error(`${internalLogger2.prefix}
`, ...args);
    } : noop;
    internalLogger2.warn = internalLoggerLevel >= InternalLoggerLevel.WARN ? function(...args) {
      unpatchedConsole2.warn(`${internalLogger2.prefix}
`, ...args);
    } : noop;
    internalLogger2.info = internalLoggerLevel >= InternalLoggerLevel.INFO ? function(...args) {
      unpatchedConsole2.info(`${internalLogger2.prefix}
`, ...args);
    } : noop;
    internalLogger2.debug = internalLoggerLevel >= InternalLoggerLevel.VERBOSE ? function(...args) {
      unpatchedConsole2.debug(`${internalLogger2.prefix}
`, ...args);
    } : noop;
  }
  return internalLogger2;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/internalLogger/initialize.js
var internalLogger = defaultInternalLogger;
function initializeInternalLogger(unpatchedConsole2, config) {
  internalLogger = createInternalLogger(unpatchedConsole2, config.internalLoggerLevel);
  return internalLogger;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/extensions/baseExtension.js
var BaseExtension = class {
  constructor() {
    this.unpatchedConsole = defaultUnpatchedConsole;
    this.internalLogger = defaultInternalLogger;
    this.config = {};
    this.metas = {};
  }
  logDebug(...args) {
    this.internalLogger.debug(`${this.name}
`, ...args);
  }
  logInfo(...args) {
    this.internalLogger.info(`${this.name}
`, ...args);
  }
  logWarn(...args) {
    this.internalLogger.warn(`${this.name}
`, ...args);
  }
  logError(...args) {
    this.internalLogger.error(`${this.name}
`, ...args);
  }
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/transports/base.js
var BaseTransport = class extends BaseExtension {
  isBatched() {
    return false;
  }
  getIgnoreUrls() {
    return [];
  }
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/transports/registerInitial.js
function registerInitialTransports(faro2) {
  faro2.transports.add(...faro2.config.transports);
  faro2.transports.addBeforeSendHooks(faro2.config.beforeSend);
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/transports/utils.js
function mergeResourceSpans(traces, resourceSpans) {
  var _a, _b;
  if (resourceSpans === void 0) {
    return traces;
  }
  if (traces === void 0) {
    return {
      resourceSpans
    };
  }
  const currentResource = (_a = traces.resourceSpans) === null || _a === void 0 ? void 0 : _a[0];
  if (currentResource === void 0) {
    return traces;
  }
  const currentSpans = (currentResource === null || currentResource === void 0 ? void 0 : currentResource.scopeSpans) || [];
  const newSpans = ((_b = resourceSpans === null || resourceSpans === void 0 ? void 0 : resourceSpans[0]) === null || _b === void 0 ? void 0 : _b.scopeSpans) || [];
  return Object.assign(Object.assign({}, traces), { resourceSpans: [
    Object.assign(Object.assign({}, currentResource), { scopeSpans: [...currentSpans, ...newSpans] })
  ] });
}
function getTransportBody(item) {
  let body = {
    meta: {}
  };
  if (item[0] !== void 0) {
    body.meta = item[0].meta;
  }
  item.forEach((currentItem) => {
    switch (currentItem.type) {
      case TransportItemType.LOG:
      case TransportItemType.EVENT:
      case TransportItemType.EXCEPTION:
      case TransportItemType.MEASUREMENT:
        const bk = transportItemTypeToBodyKey[currentItem.type];
        const signals = body[bk];
        body = Object.assign(Object.assign({}, body), { [bk]: signals === void 0 ? [currentItem.payload] : [...signals, currentItem.payload] });
        break;
      case TransportItemType.TRACE:
        body = Object.assign(Object.assign({}, body), { traces: mergeResourceSpans(body.traces, currentItem.payload.resourceSpans) });
        break;
    }
  });
  return body;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/const.js
var USER_ACTION_START = "user-action-start";
var USER_ACTION_END = "user-action-end";
var USER_ACTION_CANCEL = "user-action-cancel";
var USER_ACTION_HALT = "user-action-halt";

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/events/initialize.js
function initializeEventsAPI({ internalLogger: internalLogger2, config, metas, transports, tracesApi, actionBuffer, getMessage }) {
  let lastPayload = null;
  const pushEvent = (name, attributes, domain, { skipDedupe, spanContext, timestampOverwriteMs, customPayloadTransformer = (payload) => payload } = {}) => {
    try {
      const attrs = stringifyObjectValues(attributes);
      const item = {
        meta: metas.value,
        payload: customPayloadTransformer({
          name,
          domain: domain !== null && domain !== void 0 ? domain : config.eventDomain,
          attributes: isEmpty(attrs) ? void 0 : attrs,
          timestamp: timestampOverwriteMs ? timestampToIsoString(timestampOverwriteMs) : getCurrentTimestamp(),
          trace: spanContext ? {
            trace_id: spanContext.traceId,
            span_id: spanContext.spanId
          } : tracesApi.getTraceContext()
        }),
        type: TransportItemType.EVENT
      };
      const testingPayload = {
        name: item.payload.name,
        attributes: item.payload.attributes,
        domain: item.payload.domain
      };
      if (!skipDedupe && config.dedupe && !isNull(lastPayload) && deepEqual(testingPayload, lastPayload)) {
        internalLogger2.debug("Skipping event push because it is the same as the last one\n", item.payload);
        return;
      }
      lastPayload = testingPayload;
      internalLogger2.debug("Pushing event\n", item);
      const msg = getMessage();
      if (msg && msg.type === USER_ACTION_START) {
        actionBuffer.addItem(item);
      } else {
        transports.execute(item);
      }
    } catch (err) {
      internalLogger2.error("Error pushing event", err);
    }
  };
  return {
    pushEvent
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/exceptions/const.js
var defaultExceptionType = "Error";
var defaultErrorArgsSerializer = (args) => {
  return args.map((arg) => {
    if (isObject(arg)) {
      return stringifyExternalJson(arg);
    }
    return String(arg);
  }).join(" ");
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/utils.js
function shouldIgnoreEvent(patterns, msg) {
  return patterns.some((pattern) => {
    return isString(pattern) ? msg.includes(pattern) : !!msg.match(pattern);
  });
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/exceptions/initialize.js
var stacktraceParser;
function initializeExceptionsAPI({ internalLogger: internalLogger2, config, metas, transports, tracesApi, actionBuffer, getMessage }) {
  var _a;
  internalLogger2.debug("Initializing exceptions API");
  let lastPayload = null;
  stacktraceParser = (_a = config.parseStacktrace) !== null && _a !== void 0 ? _a : stacktraceParser;
  const changeStacktraceParser = (newStacktraceParser) => {
    internalLogger2.debug("Changing stacktrace parser");
    stacktraceParser = newStacktraceParser !== null && newStacktraceParser !== void 0 ? newStacktraceParser : stacktraceParser;
  };
  const getStacktraceParser = () => stacktraceParser;
  const { ignoreErrors = [], preserveOriginalError } = config;
  const pushError = (error, { skipDedupe, stackFrames, type, context, spanContext, timestampOverwriteMs, originalError } = {}) => {
    if (isErrorIgnored(ignoreErrors, originalError !== null && originalError !== void 0 ? originalError : error)) {
      return;
    }
    try {
      const ctx = stringifyObjectValues(Object.assign(Object.assign({}, parseCause(originalError !== null && originalError !== void 0 ? originalError : error)), context !== null && context !== void 0 ? context : {}));
      const item = {
        meta: metas.value,
        payload: Object.assign(Object.assign({ type: type || error.name || defaultExceptionType, value: error.message, timestamp: timestampOverwriteMs ? timestampToIsoString(timestampOverwriteMs) : getCurrentTimestamp(), trace: spanContext ? {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId
        } : tracesApi.getTraceContext() }, isEmpty(ctx) ? {} : { context: ctx }), preserveOriginalError ? { originalError } : {}),
        type: TransportItemType.EXCEPTION
      };
      stackFrames = stackFrames !== null && stackFrames !== void 0 ? stackFrames : error.stack ? stacktraceParser === null || stacktraceParser === void 0 ? void 0 : stacktraceParser(error).frames : void 0;
      if (stackFrames === null || stackFrames === void 0 ? void 0 : stackFrames.length) {
        item.payload.stacktrace = {
          frames: stackFrames
        };
      }
      const testingPayload = {
        type: item.payload.type,
        value: item.payload.value,
        stackTrace: item.payload.stacktrace,
        context: item.payload.context
      };
      if (!skipDedupe && config.dedupe && !isNull(lastPayload) && deepEqual(testingPayload, lastPayload)) {
        internalLogger2.debug("Skipping error push because it is the same as the last one\n", item.payload);
        return;
      }
      lastPayload = testingPayload;
      internalLogger2.debug("Pushing exception\n", item);
      const msg = getMessage();
      if (msg && msg.type === USER_ACTION_START) {
        actionBuffer.addItem(item);
      } else {
        transports.execute(item);
      }
    } catch (err) {
      internalLogger2.error("Error pushing event", err);
    }
  };
  changeStacktraceParser(config.parseStacktrace);
  return {
    changeStacktraceParser,
    getStacktraceParser,
    pushError
  };
}
function parseCause(error) {
  let cause = error.cause;
  if (isError(cause)) {
    cause = error.cause.toString();
  } else if (cause !== null && (isObject(error.cause) || isArray(error.cause))) {
    cause = stringifyExternalJson(error.cause);
  } else if (cause != null) {
    cause = error.cause.toString();
  }
  return cause == null ? {} : { cause };
}
function isErrorIgnored(ignoreErrors, error) {
  const { message, name, stack } = error;
  return shouldIgnoreEvent(ignoreErrors, message + " " + name + " " + stack);
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/logs/const.js
var defaultLogArgsSerializer = (args) => args.map((arg) => {
  try {
    return String(arg);
  } catch (err) {
    return "";
  }
}).join(" ");

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/logs/initialize.js
function initializeLogsAPI({ internalLogger: internalLogger2, config, metas, transports, tracesApi, actionBuffer, getMessage }) {
  var _a;
  internalLogger2.debug("Initializing logs API");
  let lastPayload = null;
  const logArgsSerializer = (_a = config.logArgsSerializer) !== null && _a !== void 0 ? _a : defaultLogArgsSerializer;
  const pushLog = (args, { context, level, skipDedupe, spanContext, timestampOverwriteMs } = {}) => {
    try {
      const ctx = stringifyObjectValues(context);
      const item = {
        type: TransportItemType.LOG,
        payload: {
          message: logArgsSerializer(args),
          level: level !== null && level !== void 0 ? level : defaultLogLevel,
          context: isEmpty(ctx) ? void 0 : ctx,
          timestamp: timestampOverwriteMs ? timestampToIsoString(timestampOverwriteMs) : getCurrentTimestamp(),
          trace: spanContext ? {
            trace_id: spanContext.traceId,
            span_id: spanContext.spanId
          } : tracesApi.getTraceContext()
        },
        meta: metas.value
      };
      const testingPayload = {
        message: item.payload.message,
        level: item.payload.level,
        context: item.payload.context
      };
      if (!skipDedupe && config.dedupe && !isNull(lastPayload) && deepEqual(testingPayload, lastPayload)) {
        internalLogger2.debug("Skipping log push because it is the same as the last one\n", item.payload);
        return;
      }
      lastPayload = testingPayload;
      internalLogger2.debug("Pushing log\n", item);
      const msg = getMessage();
      if (msg && msg.type === USER_ACTION_START) {
        actionBuffer.addItem(item);
      } else {
        transports.execute(item);
      }
    } catch (err) {
      internalLogger2.error("Error pushing log\n", err);
    }
  };
  return {
    pushLog
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/measurements/initialize.js
function initializeMeasurementsAPI({ internalLogger: internalLogger2, config, metas, transports, tracesApi, actionBuffer, getMessage }) {
  internalLogger2.debug("Initializing measurements API");
  let lastPayload = null;
  const pushMeasurement = (payload, { skipDedupe, context, spanContext, timestampOverwriteMs } = {}) => {
    try {
      const ctx = stringifyObjectValues(context);
      const item = {
        type: TransportItemType.MEASUREMENT,
        payload: Object.assign(Object.assign({}, payload), { trace: spanContext ? {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId
        } : tracesApi.getTraceContext(), timestamp: timestampOverwriteMs ? timestampToIsoString(timestampOverwriteMs) : getCurrentTimestamp(), context: isEmpty(ctx) ? void 0 : ctx }),
        meta: metas.value
      };
      const testingPayload = {
        type: item.payload.type,
        values: item.payload.values,
        context: item.payload.context
      };
      if (!skipDedupe && config.dedupe && !isNull(lastPayload) && deepEqual(testingPayload, lastPayload)) {
        internalLogger2.debug("Skipping measurement push because it is the same as the last one\n", item.payload);
        return;
      }
      lastPayload = testingPayload;
      internalLogger2.debug("Pushing measurement\n", item);
      const msg = getMessage();
      if (msg && msg.type === USER_ACTION_START) {
        actionBuffer.addItem(item);
      } else {
        transports.execute(item);
      }
    } catch (err) {
      internalLogger2.error("Error pushing measurement\n", err);
    }
  };
  return {
    pushMeasurement
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/meta/initialize.js
function initializeMetaAPI({ internalLogger: internalLogger2, metas }) {
  internalLogger2.debug("Initializing meta API");
  let metaSession = void 0;
  let metaUser = void 0;
  let metaView = void 0;
  let metaPage = void 0;
  const setUser = (user) => {
    if (metaUser) {
      metas.remove(metaUser);
    }
    metaUser = {
      user
    };
    metas.add(metaUser);
  };
  const setSession = (session, options) => {
    var _a;
    const newOverrides = options === null || options === void 0 ? void 0 : options.overrides;
    const overrides = newOverrides ? {
      overrides: Object.assign(Object.assign({}, (_a = metaSession === null || metaSession === void 0 ? void 0 : metaSession.session) === null || _a === void 0 ? void 0 : _a.overrides), newOverrides)
    } : {};
    if (metaSession) {
      metas.remove(metaSession);
    }
    metaSession = {
      session: Object.assign(Object.assign({}, isEmpty(session) ? void 0 : session), overrides)
    };
    metas.add(metaSession);
  };
  const getSession = () => metas.value.session;
  const setView = (view, options) => {
    var _a;
    if (options === null || options === void 0 ? void 0 : options.overrides) {
      setSession(getSession(), { overrides: options.overrides });
    }
    if (((_a = metaView === null || metaView === void 0 ? void 0 : metaView.view) === null || _a === void 0 ? void 0 : _a.name) === (view === null || view === void 0 ? void 0 : view.name)) {
      return;
    }
    const previousView = metaView;
    metaView = {
      view
    };
    metas.add(metaView);
    if (previousView) {
      metas.remove(previousView);
    }
  };
  const getView = () => metas.value.view;
  const setPage = (page) => {
    var _a;
    const pageMeta = isString(page) ? Object.assign(Object.assign({}, (_a = metaPage === null || metaPage === void 0 ? void 0 : metaPage.page) !== null && _a !== void 0 ? _a : getPage()), { id: page }) : page;
    if (metaPage) {
      metas.remove(metaPage);
    }
    metaPage = {
      page: pageMeta
    };
    metas.add(metaPage);
  };
  const getPage = () => metas.value.page;
  return {
    setUser,
    resetUser: setUser,
    setSession,
    resetSession: setSession,
    getSession,
    setView,
    getView,
    setPage,
    getPage
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/traces/initialize.js
function initializeTracesAPI(_unpatchedConsole, internalLogger2, _config, metas, transports) {
  internalLogger2.debug("Initializing traces API");
  let otel = void 0;
  const initOTEL = (trace, context) => {
    internalLogger2.debug("Initializing OpenTelemetry");
    otel = {
      trace,
      context
    };
  };
  const getTraceContext = () => {
    const ctx = otel === null || otel === void 0 ? void 0 : otel.trace.getSpanContext(otel.context.active());
    return !ctx ? void 0 : {
      trace_id: ctx.traceId,
      span_id: ctx.spanId
    };
  };
  const pushTraces = (payload) => {
    try {
      const item = {
        type: TransportItemType.TRACE,
        payload,
        meta: metas.value
      };
      internalLogger2.debug("Pushing trace\n", item);
      transports.execute(item);
    } catch (err) {
      internalLogger2.error("Error pushing trace\n", err);
    }
  };
  const getOTEL = () => otel;
  const isOTELInitialized = () => !!otel;
  return {
    getOTEL,
    getTraceContext,
    initOTEL,
    isOTELInitialized,
    pushTraces
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/ItemBuffer.js
var ItemBuffer = class {
  constructor() {
    this.buffer = [];
  }
  addItem(item) {
    this.buffer.push(item);
  }
  flushBuffer(cb) {
    if (isFunction(cb)) {
      for (const item of this.buffer) {
        cb(item);
      }
    }
    this.buffer.length = 0;
  }
  size() {
    return this.buffer.length;
  }
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/userActionLifecycleHandler.js
function createUserActionLifecycleHandler({ apiMessageBus: apiMessageBus2, transports, config }) {
  const actionBuffer = new ItemBuffer();
  const trackUserActionsExcludeItem = config.trackUserActionsExcludeItem;
  let message;
  apiMessageBus2.subscribe((msg) => {
    if (USER_ACTION_START === msg.type || USER_ACTION_HALT === msg.type) {
      message = msg;
      return;
    }
    if (msg.type === USER_ACTION_END) {
      const { id, name } = msg;
      actionBuffer.flushBuffer((item) => {
        if (isExcludeFromUserAction(item, trackUserActionsExcludeItem)) {
          transports.execute(item);
          return;
        }
        const userActionItem = Object.assign(Object.assign({}, item), { payload: Object.assign(Object.assign({}, item.payload), { action: {
          parentId: id,
          name
        } }) });
        transports.execute(userActionItem);
      });
      message = void 0;
      return;
    }
    if (msg.type === USER_ACTION_CANCEL) {
      message = void 0;
      actionBuffer.flushBuffer((item) => {
        transports.execute(item);
      });
    }
  });
  const getMessage = () => message;
  return { actionBuffer, getMessage };
}
function isExcludeFromUserAction(item, trackUserActionsExcludeItem) {
  return (trackUserActionsExcludeItem === null || trackUserActionsExcludeItem === void 0 ? void 0 : trackUserActionsExcludeItem(item)) || item.type === TransportItemType.MEASUREMENT && item.payload.type === "web-vitals";
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/api/initialize.js
var apiMessageBus = new Observable();
function initializeAPI(unpatchedConsole2, internalLogger2, config, metas, transports) {
  internalLogger2.debug("Initializing API");
  const { actionBuffer, getMessage } = createUserActionLifecycleHandler({ apiMessageBus, transports, config });
  const tracesApi = initializeTracesAPI(unpatchedConsole2, internalLogger2, config, metas, transports);
  const props = {
    unpatchedConsole: unpatchedConsole2,
    internalLogger: internalLogger2,
    config,
    metas,
    transports,
    tracesApi,
    actionBuffer,
    getMessage
  };
  return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, tracesApi), initializeExceptionsAPI(props)), initializeMetaAPI(props)), initializeLogsAPI(props)), initializeMeasurementsAPI(props)), initializeEventsAPI(props));
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/instrumentations/base.js
var BaseInstrumentation = class extends BaseExtension {
  constructor() {
    super(...arguments);
    this.api = {};
    this.transports = {};
  }
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/instrumentations/initialize.js
function initializeInstrumentations(unpatchedConsole2, internalLogger2, config, metas, transports, api) {
  internalLogger2.debug("Initializing instrumentations");
  const instrumentations = [];
  const add = (...newInstrumentations) => {
    internalLogger2.debug("Adding instrumentations");
    newInstrumentations.forEach((newInstrumentation) => {
      internalLogger2.debug(`Adding "${newInstrumentation.name}" instrumentation`);
      const exists = instrumentations.some((existingInstrumentation) => existingInstrumentation.name === newInstrumentation.name);
      if (exists) {
        internalLogger2.warn(`Instrumentation ${newInstrumentation.name} is already added`);
        return;
      }
      newInstrumentation.unpatchedConsole = unpatchedConsole2;
      newInstrumentation.internalLogger = internalLogger2;
      newInstrumentation.config = config;
      newInstrumentation.metas = metas;
      newInstrumentation.transports = transports;
      newInstrumentation.api = api;
      instrumentations.push(newInstrumentation);
      newInstrumentation.initialize();
    });
  };
  const remove = (...instrumentationsToRemove) => {
    internalLogger2.debug("Removing instrumentations");
    instrumentationsToRemove.forEach((instrumentationToRemove) => {
      var _a, _b;
      internalLogger2.debug(`Removing "${instrumentationToRemove.name}" instrumentation`);
      const existingInstrumentationIndex = instrumentations.reduce((acc, existingInstrumentation, existingTransportIndex) => {
        if (acc === null && existingInstrumentation.name === instrumentationToRemove.name) {
          return existingTransportIndex;
        }
        return null;
      }, null);
      if (existingInstrumentationIndex === null) {
        internalLogger2.warn(`Instrumentation "${instrumentationToRemove.name}" is not added`);
        return;
      }
      (_b = (_a = instrumentations[existingInstrumentationIndex]).destroy) === null || _b === void 0 ? void 0 : _b.call(_a);
      instrumentations.splice(existingInstrumentationIndex, 1);
    });
  };
  return {
    add,
    get instrumentations() {
      return [...instrumentations];
    },
    remove
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/instrumentations/registerInitial.js
function registerInitialInstrumentations(faro2) {
  faro2.instrumentations.add(...faro2.config.instrumentations);
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/metas/initialize.js
function initializeMetas(_unpatchedConsole, internalLogger2, _config) {
  let items = [];
  let listeners = [];
  const getValue = () => items.reduce((acc, item) => Object.assign(acc, isFunction(item) ? item() : item), {});
  const notifyListeners = () => {
    if (listeners.length) {
      const value = getValue();
      listeners.forEach((listener) => listener(value));
    }
  };
  const add = (...newItems) => {
    internalLogger2.debug("Adding metas\n", newItems);
    items.push(...newItems);
    notifyListeners();
  };
  const remove = (...itemsToRemove) => {
    internalLogger2.debug("Removing metas\n", itemsToRemove);
    items = items.filter((currentItem) => !itemsToRemove.includes(currentItem));
    notifyListeners();
  };
  const addListener = (listener) => {
    internalLogger2.debug("Adding metas listener\n", listener);
    listeners.push(listener);
  };
  const removeListener = (listener) => {
    internalLogger2.debug("Removing metas listener\n", listener);
    listeners = listeners.filter((currentListener) => currentListener !== listener);
  };
  return {
    add,
    remove,
    addListener,
    removeListener,
    get value() {
      return getValue();
    }
  };
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/version.js
var VERSION = "1.19.0";

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/metas/registerInitial.js
function registerInitialMetas(faro2) {
  var _a, _b;
  const initial = {
    sdk: {
      version: VERSION
    },
    app: {
      bundleId: faro2.config.app.name && getBundleId(faro2.config.app.name)
    }
  };
  const session = (_a = faro2.config.sessionTracking) === null || _a === void 0 ? void 0 : _a.session;
  if (session) {
    faro2.api.setSession(session);
  }
  if (faro2.config.app) {
    initial.app = Object.assign(Object.assign({}, faro2.config.app), initial.app);
  }
  if (faro2.config.user) {
    initial.user = faro2.config.user;
  }
  if (faro2.config.view) {
    initial.view = faro2.config.view;
  }
  faro2.metas.add(initial, ...(_b = faro2.config.metas) !== null && _b !== void 0 ? _b : []);
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/sdk/const.js
var internalGlobalObjectKey = "_faroInternal";

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/sdk/faroGlobalObject.js
function setFaroOnGlobalObject(faro2) {
  if (!faro2.config.preventGlobalExposure) {
    faro2.internalLogger.debug(`Registering public faro reference in the global scope using "${faro2.config.globalObjectKey}" key`);
    if (faro2.config.globalObjectKey in globalObject) {
      faro2.internalLogger.warn(`Skipping global registration due to key "${faro2.config.globalObjectKey}" being used already. Please set "globalObjectKey" to something else or set "preventGlobalExposure" to "true"`);
      return;
    }
    Object.defineProperty(globalObject, faro2.config.globalObjectKey, {
      configurable: false,
      writable: false,
      value: faro2
    });
  } else {
    faro2.internalLogger.debug("Skipping registering public Faro instance in the global scope");
  }
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/sdk/internalFaroGlobalObject.js
function getInternalFromGlobalObject() {
  return globalObject[internalGlobalObjectKey];
}
function setInternalFaroOnGlobalObject(faro2) {
  if (!faro2.config.isolate) {
    faro2.internalLogger.debug("Registering internal Faro instance on global object");
    Object.defineProperty(globalObject, internalGlobalObjectKey, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: faro2
    });
  } else {
    faro2.internalLogger.debug("Skipping registering internal Faro instance on global object");
  }
}
function isInternalFaroOnGlobalObject() {
  return internalGlobalObjectKey in globalObject;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/sdk/registerFaro.js
var faro = {};
function registerFaro(unpatchedConsole2, internalLogger2, config, metas, transports, api, instrumentations) {
  internalLogger2.debug("Initializing Faro");
  faro = {
    api,
    config,
    instrumentations,
    internalLogger: internalLogger2,
    metas,
    pause: transports.pause,
    transports,
    unpatchedConsole: unpatchedConsole2,
    unpause: transports.unpause
  };
  setInternalFaroOnGlobalObject(faro);
  setFaroOnGlobalObject(faro);
  return faro;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/initialize.js
function initializeFaro(config) {
  const unpatchedConsole2 = initializeUnpatchedConsole(config);
  const internalLogger2 = initializeInternalLogger(unpatchedConsole2, config);
  if (isInternalFaroOnGlobalObject() && !config.isolate) {
    internalLogger2.error('Faro is already registered. Either add instrumentations, transports etc. to the global faro instance or use the "isolate" property');
    return void 0;
  }
  internalLogger2.debug("Initializing");
  const metas = initializeMetas(unpatchedConsole2, internalLogger2, config);
  const transports = initializeTransports(unpatchedConsole2, internalLogger2, config, metas);
  const api = initializeAPI(unpatchedConsole2, internalLogger2, config, metas, transports);
  const instrumentations = initializeInstrumentations(unpatchedConsole2, internalLogger2, config, metas, transports, api);
  const faro2 = registerFaro(unpatchedConsole2, internalLogger2, config, metas, transports, api, instrumentations);
  registerInitialMetas(faro2);
  registerInitialTransports(faro2);
  registerInitialInstrumentations(faro2);
  return faro2;
}

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/config/const.js
var defaultGlobalObjectKey = "faro";
var defaultBatchingConfig = {
  enabled: true,
  sendTimeout: 250,
  itemLimit: 50
};

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/semantic.js
var Conventions = {
  /**
   * @deprecated The event names object will be removed in a future version
   */
  EventNames: {
    CLICK: "click",
    NAVIGATION: "navigation",
    SESSION_START: "session_start",
    VIEW_CHANGED: "view_changed"
  }
};
var EVENT_CLICK = "click";
var EVENT_NAVIGATION = "navigation";
var EVENT_VIEW_CHANGED = "view_changed";
var EVENT_SESSION_START = "session_start";
var EVENT_SESSION_RESUME = "session_resume";
var EVENT_SESSION_EXTEND = "session_extend";
var EVENT_OVERRIDES_SERVICE_NAME = "service_name_override";
var EVENT_ROUTE_CHANGE = "route_change";

// node_modules/.pnpm/@grafana+faro-core@1.19.0/node_modules/@grafana/faro-core/dist/esm/consts.js
var unknownString = "unknown";

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/metas/browser/meta.js
var import_ua_parser_js = __toESM(require_ua_parser());
var browserMeta = () => {
  const parser = new import_ua_parser_js.UAParser();
  const { name, version } = parser.getBrowser();
  const { name: osName, version: osVersion } = parser.getOS();
  const userAgent = parser.getUA();
  const language = navigator.language;
  const mobile = navigator.userAgent.includes("Mobi");
  const brands = getBrands();
  return {
    browser: {
      name: name !== null && name !== void 0 ? name : unknownString,
      version: version !== null && version !== void 0 ? version : unknownString,
      os: `${osName !== null && osName !== void 0 ? osName : unknownString} ${osVersion !== null && osVersion !== void 0 ? osVersion : unknownString}`,
      userAgent: userAgent !== null && userAgent !== void 0 ? userAgent : unknownString,
      language: language !== null && language !== void 0 ? language : unknownString,
      mobile,
      brands: brands !== null && brands !== void 0 ? brands : unknownString,
      viewportWidth: `${window.innerWidth}`,
      viewportHeight: `${window.innerHeight}`
    }
  };
  function getBrands() {
    if (!name || !version) {
      return void 0;
    }
    if ("userAgentData" in navigator && navigator.userAgentData) {
      return navigator.userAgentData.brands;
    }
    return void 0;
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/metas/session/createSession.js
function createSession(attributes) {
  var _a, _b, _c, _d;
  return {
    id: (_d = (_c = (_b = (_a = faro.config) === null || _a === void 0 ? void 0 : _a.sessionTracking) === null || _b === void 0 ? void 0 : _b.generateSessionId) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : genShortID(),
    attributes
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/metas/sdk/meta.js
var sdkMeta = () => ({
  sdk: {
    name: "@grafana/faro-core",
    version: VERSION,
    integrations: faro.config.instrumentations.map(({ name, version }) => ({ name, version }))
  }
});

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/utils/webStorage.js
var webStorageType = {
  session: "sessionStorage",
  local: "localStorage"
};
function isWebStorageAvailable(type) {
  var _a;
  try {
    let storage;
    storage = window[type];
    const testItem = "__faro_storage_test__";
    storage.setItem(testItem, testItem);
    storage.removeItem(testItem);
    return true;
  } catch (error) {
    (_a = faro.internalLogger) === null || _a === void 0 ? void 0 : _a.info(`Web storage of type ${type} is not available. Reason: ${error}`);
    return false;
  }
}
function getItem(key, webStorageMechanism) {
  if (isWebStorageTypeAvailable(webStorageMechanism)) {
    return window[webStorageMechanism].getItem(key);
  }
  return null;
}
function setItem(key, value, webStorageMechanism) {
  if (isWebStorageTypeAvailable(webStorageMechanism)) {
    try {
      window[webStorageMechanism].setItem(key, value);
    } catch (error) {
    }
  }
}
function removeItem(key, webStorageMechanism) {
  if (isWebStorageTypeAvailable(webStorageMechanism)) {
    window[webStorageMechanism].removeItem(key);
  }
}
var isLocalStorageAvailable = isWebStorageAvailable(webStorageType.local);
var isSessionStorageAvailable = isWebStorageAvailable(webStorageType.session);
function isWebStorageTypeAvailable(webStorageMechanism) {
  if (webStorageMechanism === webStorageType.local) {
    return isLocalStorageAvailable;
  }
  if (webStorageMechanism === webStorageType.session) {
    return isSessionStorageAvailable;
  }
  return false;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/utils/throttle.js
function throttle(callback, delay) {
  let pause = false;
  let lastPending;
  const timeoutBehavior = () => {
    if (lastPending == null) {
      pause = false;
      return;
    }
    callback(...lastPending);
    lastPending = null;
    setTimeout(timeoutBehavior, delay);
  };
  return (...args) => {
    if (pause) {
      lastPending = args;
      return;
    }
    callback(...args);
    pause = true;
    setTimeout(timeoutBehavior, delay);
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/utils/url.js
function getIgnoreUrls() {
  return faro.transports.transports.flatMap((transport) => transport.getIgnoreUrls());
}
function isUrlIgnored(url = "") {
  return getIgnoreUrls().some((ignoredUrl) => url && url.match(ignoredUrl) != null);
}
function getUrlFromResource(resource) {
  if (isString(resource)) {
    return resource;
  }
  if (resource instanceof URL) {
    return resource.href;
  }
  if (!isEmpty(resource) && isFunction(resource === null || resource === void 0 ? void 0 : resource.toString)) {
    return resource.toString();
  }
  return void 0;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/sessionManager/sessionConstants.js
var STORAGE_KEY = "com.grafana.faro.session";
var SESSION_EXPIRATION_TIME = 4 * 60 * 60 * 1e3;
var SESSION_INACTIVITY_TIME = 15 * 60 * 1e3;
var STORAGE_UPDATE_DELAY = 1 * 1e3;
var MAX_SESSION_PERSISTENCE_TIME_BUFFER = 1 * 60 * 1e3;
var MAX_SESSION_PERSISTENCE_TIME = SESSION_INACTIVITY_TIME;
var defaultSessionTrackingConfig = {
  enabled: true,
  persistent: false,
  maxSessionPersistenceTime: MAX_SESSION_PERSISTENCE_TIME
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/sessionManager/sampling.js
function isSampled() {
  var _a, _b, _c;
  const sendAllSignals = 1;
  const sessionTracking = faro.config.sessionTracking;
  let samplingRate = (_c = (_b = (_a = sessionTracking === null || sessionTracking === void 0 ? void 0 : sessionTracking.sampler) === null || _a === void 0 ? void 0 : _a.call(sessionTracking, { metas: faro.metas.value })) !== null && _b !== void 0 ? _b : sessionTracking === null || sessionTracking === void 0 ? void 0 : sessionTracking.samplingRate) !== null && _c !== void 0 ? _c : sendAllSignals;
  if (typeof samplingRate !== "number") {
    const sendNoSignals = 0;
    samplingRate = sendNoSignals;
  }
  return Math.random() < samplingRate;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/sessionManager/sessionManagerUtils.js
function createUserSessionObject({ sessionId, started, lastActivity, isSampled: isSampled2 = true } = {}) {
  var _a, _b;
  const now = dateNow();
  const generateSessionId = (_b = (_a = faro.config) === null || _a === void 0 ? void 0 : _a.sessionTracking) === null || _b === void 0 ? void 0 : _b.generateSessionId;
  if (sessionId == null) {
    sessionId = typeof generateSessionId === "function" ? generateSessionId() : genShortID();
  }
  return {
    sessionId,
    lastActivity: lastActivity !== null && lastActivity !== void 0 ? lastActivity : now,
    started: started !== null && started !== void 0 ? started : now,
    isSampled: isSampled2
  };
}
function isUserSessionValid(session) {
  if (session == null) {
    return false;
  }
  const now = dateNow();
  const lifetimeValid = now - session.started < SESSION_EXPIRATION_TIME;
  if (!lifetimeValid) {
    return false;
  }
  const inactivityPeriodValid = now - session.lastActivity < SESSION_INACTIVITY_TIME;
  return inactivityPeriodValid;
}
function getUserSessionUpdater({ fetchUserSession, storeUserSession }) {
  return function updateSession({ forceSessionExtend } = { forceSessionExtend: false }) {
    var _a, _b, _c;
    if (!fetchUserSession || !storeUserSession) {
      return;
    }
    const sessionTrackingConfig = faro.config.sessionTracking;
    const isPersistentSessions = sessionTrackingConfig === null || sessionTrackingConfig === void 0 ? void 0 : sessionTrackingConfig.persistent;
    if (isPersistentSessions && !isLocalStorageAvailable || !isPersistentSessions && !isSessionStorageAvailable) {
      return;
    }
    const sessionFromStorage = fetchUserSession();
    if (forceSessionExtend === false && isUserSessionValid(sessionFromStorage)) {
      storeUserSession(Object.assign(Object.assign({}, sessionFromStorage), { lastActivity: dateNow() }));
    } else {
      let newSession = addSessionMetadataToNextSession(createUserSessionObject({ isSampled: isSampled() }), sessionFromStorage);
      storeUserSession(newSession);
      (_a = faro.api) === null || _a === void 0 ? void 0 : _a.setSession(newSession.sessionMeta);
      (_b = sessionTrackingConfig === null || sessionTrackingConfig === void 0 ? void 0 : sessionTrackingConfig.onSessionChange) === null || _b === void 0 ? void 0 : _b.call(sessionTrackingConfig, (_c = sessionFromStorage === null || sessionFromStorage === void 0 ? void 0 : sessionFromStorage.sessionMeta) !== null && _c !== void 0 ? _c : null, newSession.sessionMeta);
    }
  };
}
function addSessionMetadataToNextSession(newSession, previousSession) {
  var _a, _b, _c, _d, _e, _f, _g;
  const sessionWithMeta = Object.assign(Object.assign({}, newSession), { sessionMeta: {
    id: newSession.sessionId,
    attributes: Object.assign(Object.assign(Object.assign({}, (_b = (_a = faro.config.sessionTracking) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.attributes), (_d = (_c = faro.metas.value.session) === null || _c === void 0 ? void 0 : _c.attributes) !== null && _d !== void 0 ? _d : {}), { isSampled: newSession.isSampled.toString() })
  } });
  const overrides = (_f = (_e = faro.metas.value.session) === null || _e === void 0 ? void 0 : _e.overrides) !== null && _f !== void 0 ? _f : (_g = previousSession === null || previousSession === void 0 ? void 0 : previousSession.sessionMeta) === null || _g === void 0 ? void 0 : _g.overrides;
  if (!isEmpty(overrides)) {
    sessionWithMeta.sessionMeta.overrides = overrides;
  }
  const previousSessionId = previousSession === null || previousSession === void 0 ? void 0 : previousSession.sessionId;
  if (previousSessionId != null) {
    sessionWithMeta.sessionMeta.attributes["previousSession"] = previousSessionId;
  }
  return sessionWithMeta;
}
function getSessionMetaUpdateHandler({ fetchUserSession, storeUserSession }) {
  return function syncSessionIfChangedExternally(meta) {
    const session = meta.session;
    const sessionFromSessionStorage = fetchUserSession();
    let sessionId = session === null || session === void 0 ? void 0 : session.id;
    const sessionAttributes = session === null || session === void 0 ? void 0 : session.attributes;
    const sessionOverrides = session === null || session === void 0 ? void 0 : session.overrides;
    const storedSessionMeta = sessionFromSessionStorage === null || sessionFromSessionStorage === void 0 ? void 0 : sessionFromSessionStorage.sessionMeta;
    const storedSessionMetaOverrides = storedSessionMeta === null || storedSessionMeta === void 0 ? void 0 : storedSessionMeta.overrides;
    const hasSessionOverridesChanged = !!sessionOverrides && !deepEqual(sessionOverrides, storedSessionMetaOverrides);
    const hasAttributesChanged = !!sessionAttributes && !deepEqual(sessionAttributes, storedSessionMeta === null || storedSessionMeta === void 0 ? void 0 : storedSessionMeta.attributes);
    const hasSessionIdChanged = !!session && sessionId !== (sessionFromSessionStorage === null || sessionFromSessionStorage === void 0 ? void 0 : sessionFromSessionStorage.sessionId);
    if (hasSessionIdChanged || hasAttributesChanged || hasSessionOverridesChanged) {
      const userSession = addSessionMetadataToNextSession(createUserSessionObject({ sessionId, isSampled: isSampled() }), sessionFromSessionStorage);
      storeUserSession(userSession);
      sendOverrideEvent(hasSessionOverridesChanged, sessionOverrides, storedSessionMetaOverrides);
      faro.api.setSession(userSession.sessionMeta);
    }
  };
}
function sendOverrideEvent(hasSessionOverridesChanged, sessionOverrides = {}, storedSessionOverrides = {}) {
  var _a, _b, _c;
  if (!hasSessionOverridesChanged) {
    return;
  }
  const serviceName = sessionOverrides.serviceName;
  const previousServiceName = (_c = (_a = storedSessionOverrides.serviceName) !== null && _a !== void 0 ? _a : (_b = faro.metas.value.app) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "";
  if (serviceName && serviceName !== previousServiceName) {
    faro.api.pushEvent(EVENT_OVERRIDES_SERVICE_NAME, {
      serviceName,
      previousServiceName
    });
  }
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/sessionManager/PersistentSessionsManager.js
var PersistentSessionsManager = class _PersistentSessionsManager {
  constructor() {
    this.updateSession = throttle(() => this.updateUserSession(), STORAGE_UPDATE_DELAY);
    this.updateUserSession = getUserSessionUpdater({
      fetchUserSession: _PersistentSessionsManager.fetchUserSession,
      storeUserSession: _PersistentSessionsManager.storeUserSession
    });
    this.init();
  }
  static removeUserSession() {
    removeItem(STORAGE_KEY, _PersistentSessionsManager.storageTypeLocal);
  }
  static storeUserSession(session) {
    setItem(STORAGE_KEY, stringifyExternalJson(session), _PersistentSessionsManager.storageTypeLocal);
  }
  static fetchUserSession() {
    const storedSession = getItem(STORAGE_KEY, _PersistentSessionsManager.storageTypeLocal);
    if (storedSession) {
      return JSON.parse(storedSession);
    }
    return null;
  }
  init() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.updateSession();
      }
    });
    faro.metas.addListener(getSessionMetaUpdateHandler({
      fetchUserSession: _PersistentSessionsManager.fetchUserSession,
      storeUserSession: _PersistentSessionsManager.storeUserSession
    }));
  }
};
PersistentSessionsManager.storageTypeLocal = webStorageType.local;

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/sessionManager/VolatileSessionManager.js
var VolatileSessionsManager = class _VolatileSessionsManager {
  constructor() {
    this.updateSession = throttle(() => this.updateUserSession(), STORAGE_UPDATE_DELAY);
    this.updateUserSession = getUserSessionUpdater({
      fetchUserSession: _VolatileSessionsManager.fetchUserSession,
      storeUserSession: _VolatileSessionsManager.storeUserSession
    });
    this.init();
  }
  static removeUserSession() {
    removeItem(STORAGE_KEY, _VolatileSessionsManager.storageTypeSession);
  }
  static storeUserSession(session) {
    setItem(STORAGE_KEY, stringifyExternalJson(session), _VolatileSessionsManager.storageTypeSession);
  }
  static fetchUserSession() {
    const storedSession = getItem(STORAGE_KEY, _VolatileSessionsManager.storageTypeSession);
    if (storedSession) {
      return JSON.parse(storedSession);
    }
    return null;
  }
  init() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.updateSession();
      }
    });
    faro.metas.addListener(getSessionMetaUpdateHandler({
      fetchUserSession: _VolatileSessionsManager.fetchUserSession,
      storeUserSession: _VolatileSessionsManager.storeUserSession
    }));
  }
};
VolatileSessionsManager.storageTypeSession = webStorageType.session;

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/sessionManager/getSessionManagerByConfig.js
function getSessionManagerByConfig(sessionTrackingConfig) {
  return (sessionTrackingConfig === null || sessionTrackingConfig === void 0 ? void 0 : sessionTrackingConfig.persistent) ? PersistentSessionsManager : VolatileSessionsManager;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/session/instrumentation.js
var SessionInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super(...arguments);
    this.name = "@grafana/faro-web-sdk:instrumentation-session";
    this.version = VERSION;
  }
  sendSessionStartEvent(meta) {
    var _a, _b;
    const session = meta.session;
    if (session && session.id !== ((_a = this.notifiedSession) === null || _a === void 0 ? void 0 : _a.id)) {
      if (this.notifiedSession && this.notifiedSession.id === ((_b = session.attributes) === null || _b === void 0 ? void 0 : _b["previousSession"])) {
        this.api.pushEvent(EVENT_SESSION_EXTEND, {}, void 0, { skipDedupe: true });
        this.notifiedSession = session;
        return;
      }
      this.notifiedSession = session;
      this.api.pushEvent(EVENT_SESSION_START, {}, void 0, { skipDedupe: true });
    }
  }
  createInitialSession(SessionManager, sessionsConfig) {
    var _a, _b, _c, _d, _e, _f;
    let storedUserSession = SessionManager.fetchUserSession();
    if (sessionsConfig.persistent && sessionsConfig.maxSessionPersistenceTime && storedUserSession) {
      const now = dateNow();
      const shouldClearPersistentSession = storedUserSession.lastActivity < now - sessionsConfig.maxSessionPersistenceTime;
      if (shouldClearPersistentSession) {
        PersistentSessionsManager.removeUserSession();
        storedUserSession = null;
      }
    }
    let lifecycleType;
    let initialSession;
    if (isUserSessionValid(storedUserSession)) {
      const sessionId = storedUserSession === null || storedUserSession === void 0 ? void 0 : storedUserSession.sessionId;
      initialSession = createUserSessionObject({
        sessionId,
        isSampled: storedUserSession.isSampled || false,
        started: storedUserSession === null || storedUserSession === void 0 ? void 0 : storedUserSession.started
      });
      const storedUserSessionMeta = storedUserSession === null || storedUserSession === void 0 ? void 0 : storedUserSession.sessionMeta;
      const overrides = Object.assign(Object.assign({}, (_a = sessionsConfig.session) === null || _a === void 0 ? void 0 : _a.overrides), storedUserSessionMeta === null || storedUserSessionMeta === void 0 ? void 0 : storedUserSessionMeta.overrides);
      initialSession.sessionMeta = Object.assign(Object.assign({}, sessionsConfig.session), { id: sessionId, attributes: Object.assign(Object.assign(Object.assign({}, (_b = sessionsConfig.session) === null || _b === void 0 ? void 0 : _b.attributes), storedUserSessionMeta === null || storedUserSessionMeta === void 0 ? void 0 : storedUserSessionMeta.attributes), {
        // For valid resumed sessions we do not want to recalculate the sampling decision on each init phase.
        isSampled: initialSession.isSampled.toString()
      }), overrides });
      lifecycleType = EVENT_SESSION_RESUME;
    } else {
      const sessionId = (_d = (_c = sessionsConfig.session) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : createSession().id;
      initialSession = createUserSessionObject({
        sessionId,
        isSampled: isSampled()
      });
      const overrides = (_e = sessionsConfig.session) === null || _e === void 0 ? void 0 : _e.overrides;
      initialSession.sessionMeta = Object.assign({ id: sessionId, attributes: Object.assign({ isSampled: initialSession.isSampled.toString() }, (_f = sessionsConfig.session) === null || _f === void 0 ? void 0 : _f.attributes) }, overrides ? { overrides } : {});
      lifecycleType = EVENT_SESSION_START;
    }
    return { initialSession, lifecycleType };
  }
  registerBeforeSendHook(SessionManager) {
    var _a;
    const { updateSession } = new SessionManager();
    (_a = this.transports) === null || _a === void 0 ? void 0 : _a.addBeforeSendHooks((item) => {
      var _a2, _b, _c;
      updateSession();
      const attributes = (_a2 = item.meta.session) === null || _a2 === void 0 ? void 0 : _a2.attributes;
      if (attributes && (attributes === null || attributes === void 0 ? void 0 : attributes["isSampled"]) === "true") {
        let newItem = JSON.parse(JSON.stringify(item));
        const newAttributes = (_b = newItem.meta.session) === null || _b === void 0 ? void 0 : _b.attributes;
        newAttributes === null || newAttributes === void 0 ? true : delete newAttributes["isSampled"];
        if (Object.keys(newAttributes !== null && newAttributes !== void 0 ? newAttributes : {}).length === 0) {
          (_c = newItem.meta.session) === null || _c === void 0 ? true : delete _c.attributes;
        }
        return newItem;
      }
      return null;
    });
  }
  initialize() {
    this.logDebug("init session instrumentation");
    const sessionTrackingConfig = this.config.sessionTracking;
    if (sessionTrackingConfig === null || sessionTrackingConfig === void 0 ? void 0 : sessionTrackingConfig.enabled) {
      const SessionManager = getSessionManagerByConfig(sessionTrackingConfig);
      this.registerBeforeSendHook(SessionManager);
      const { initialSession, lifecycleType } = this.createInitialSession(SessionManager, sessionTrackingConfig);
      SessionManager.storeUserSession(initialSession);
      const initialSessionMeta = initialSession.sessionMeta;
      this.notifiedSession = initialSessionMeta;
      this.api.setSession(initialSessionMeta);
      if (lifecycleType === EVENT_SESSION_START) {
        this.api.pushEvent(EVENT_SESSION_START, {}, void 0, { skipDedupe: true });
      }
      if (lifecycleType === EVENT_SESSION_RESUME) {
        this.api.pushEvent(EVENT_SESSION_RESUME, {}, void 0, { skipDedupe: true });
      }
    }
    this.metas.addListener(this.sendSessionStartEvent.bind(this));
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/const.js
var primitiveUnhandledValue = "Non-Error promise rejection captured with value:";
var primitiveUnhandledType = "UnhandledRejection";
var domErrorType = "DOMError";
var domExceptionType = "DOMException";
var objectEventValue = "Non-Error exception captured with keys:";
var unknownSymbolString = "?";
var valueTypeRegex = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/getValueAndTypeFromMessage.js
function getValueAndTypeFromMessage(message) {
  var _a, _b;
  const groups = message.match(valueTypeRegex);
  const type = (_a = groups === null || groups === void 0 ? void 0 : groups[1]) !== null && _a !== void 0 ? _a : defaultExceptionType;
  const value = (_b = groups === null || groups === void 0 ? void 0 : groups[2]) !== null && _b !== void 0 ? _b : message;
  return [value, type];
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/stackFrames/const.js
var newLineString = "\n";
var evalString = "eval";
var unknownSymbolString2 = "?";
var atString = "@";
var webkitLineRegex = /^\s*at (?:(.*?) ?\((?:address at )?)?((?:file|https?|blob|chrome-extension|address|native|eval|webpack|<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
var webkitEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
var webkitEvalString = "eval";
var webkitAddressAtString = "address at ";
var webkitAddressAtStringLength = webkitAddressAtString.length;
var firefoxLineRegex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:file|https?|blob|chrome|webpack|resource|moz-extension|safari-extension|safari-web-extension|capacitor)?:\/.*?|\[native code]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
var firefoxEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
var firefoxEvalString = " > eval";
var safariExtensionString = "safari-extension";
var safariWebExtensionString = "safari-web-extension";
var reactMinifiedRegex = /Minified React error #\d+;/i;

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/stackFrames/buildStackFrame.js
function buildStackFrame(filename, func, lineno, colno) {
  const stackFrame = {
    filename: filename || document.location.href,
    function: func || unknownSymbolString2
  };
  if (lineno !== void 0) {
    stackFrame.lineno = lineno;
  }
  if (colno !== void 0) {
    stackFrame.colno = colno;
  }
  return stackFrame;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/stackFrames/getDataFromSafariExtensions.js
function getDataFromSafariExtensions(func, filename) {
  const isSafariExtension = func === null || func === void 0 ? void 0 : func.includes(safariExtensionString);
  const isSafariWebExtension = !isSafariExtension && (func === null || func === void 0 ? void 0 : func.includes(safariWebExtensionString));
  if (!isSafariExtension && !isSafariWebExtension) {
    return [func, filename];
  }
  return [
    (func === null || func === void 0 ? void 0 : func.includes(atString)) ? func.split(atString)[0] : func,
    isSafariExtension ? `${safariExtensionString}:${filename}` : `${safariWebExtensionString}:${filename}`
  ];
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/stackFrames/getStackFramesFromError.js
function getStackFramesFromError(error) {
  let lines = [];
  if (error.stacktrace) {
    lines = error.stacktrace.split(newLineString).filter((_line, idx) => idx % 2 === 0);
  } else if (error.stack) {
    lines = error.stack.split(newLineString);
  }
  const stackFrames = lines.reduce((acc, line, idx) => {
    let parts;
    let func;
    let filename;
    let lineno;
    let colno;
    if (parts = webkitLineRegex.exec(line)) {
      func = parts[1];
      filename = parts[2];
      lineno = parts[3];
      colno = parts[4];
      if (filename === null || filename === void 0 ? void 0 : filename.startsWith(webkitEvalString)) {
        const submatch = webkitEvalRegex.exec(filename);
        if (submatch) {
          filename = submatch[1];
          lineno = submatch[2];
          colno = submatch[3];
        }
      }
      filename = (filename === null || filename === void 0 ? void 0 : filename.startsWith(webkitAddressAtString)) ? filename.substring(webkitAddressAtStringLength) : filename;
      [func, filename] = getDataFromSafariExtensions(func, filename);
    } else if (parts = firefoxLineRegex.exec(line)) {
      func = parts[1];
      filename = parts[3];
      lineno = parts[4];
      colno = parts[5];
      if (!!filename && filename.includes(firefoxEvalString)) {
        const submatch = firefoxEvalRegex.exec(filename);
        if (submatch) {
          func = func || evalString;
          filename = submatch[1];
          lineno = submatch[2];
        }
      } else if (idx === 0 && !colno && isNumber(error.columnNumber)) {
        colno = String(error.columnNumber + 1);
      }
      [func, filename] = getDataFromSafariExtensions(func, filename);
    }
    if (filename || func) {
      acc.push(buildStackFrame(filename, func, lineno ? Number(lineno) : void 0, colno ? Number(colno) : void 0));
    }
    return acc;
  }, []);
  if (reactMinifiedRegex.test(error.message)) {
    return stackFrames.slice(1);
  }
  return stackFrames;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/stackFrames/parseStacktrace.js
function parseStacktrace(error) {
  return {
    frames: getStackFramesFromError(error)
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/getErrorDetails.js
function getErrorDetails(evt) {
  let value;
  let type;
  let stackFrames = [];
  let isDomErrorRes;
  let isEventRes;
  if (isErrorEvent(evt) && evt.error) {
    value = evt.error.message;
    type = evt.error.name;
    stackFrames = getStackFramesFromError(evt.error);
  } else if ((isDomErrorRes = isDomError(evt)) || isDomException(evt)) {
    const { name, message } = evt;
    type = name !== null && name !== void 0 ? name : isDomErrorRes ? domErrorType : domExceptionType;
    value = message ? `${type}: ${message}` : type;
  } else if (isError(evt)) {
    value = evt.message;
    stackFrames = getStackFramesFromError(evt);
  } else if (isObject(evt) || (isEventRes = isEvent(evt))) {
    type = isEventRes ? evt.constructor.name : void 0;
    value = `${objectEventValue} ${Object.keys(evt)}`;
  }
  return [value, type, stackFrames];
}
function getDetailsFromErrorArgs(args) {
  const [evt, source, lineno, colno, error] = args;
  let value;
  let type;
  let stackFrames = [];
  const eventIsString = isString(evt);
  const initialStackFrame = buildStackFrame(source, unknownSymbolString, lineno, colno);
  if (error || !eventIsString) {
    [value, type, stackFrames] = getErrorDetails(error !== null && error !== void 0 ? error : evt);
    if (stackFrames.length === 0) {
      stackFrames = [initialStackFrame];
    }
  } else if (eventIsString) {
    [value, type] = getValueAndTypeFromMessage(evt);
    stackFrames = [initialStackFrame];
  }
  return { value, type, stackFrames };
}
function getDetailsFromConsoleErrorArgs(args, serializer) {
  if (isError(args[0])) {
    return getDetailsFromErrorArgs(args);
  } else {
    return { value: serializer(args) };
  }
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/console/instrumentation.js
var ConsoleInstrumentation = class _ConsoleInstrumentation extends BaseInstrumentation {
  constructor(options = {}) {
    super();
    this.options = options;
    this.name = "@grafana/faro-web-sdk:instrumentation-console";
    this.version = VERSION;
    this.errorSerializer = defaultLogArgsSerializer;
  }
  initialize() {
    var _a, _b, _c, _d;
    this.options = Object.assign(Object.assign({}, this.options), this.config.consoleInstrumentation);
    const serializeErrors = ((_a = this.options) === null || _a === void 0 ? void 0 : _a.serializeErrors) || !!((_b = this.options) === null || _b === void 0 ? void 0 : _b.errorSerializer);
    this.errorSerializer = serializeErrors ? (_d = (_c = this.options) === null || _c === void 0 ? void 0 : _c.errorSerializer) !== null && _d !== void 0 ? _d : defaultErrorArgsSerializer : defaultLogArgsSerializer;
    allLogLevels.filter((level) => {
      var _a2, _b2;
      return !((_b2 = (_a2 = this.options) === null || _a2 === void 0 ? void 0 : _a2.disabledLevels) !== null && _b2 !== void 0 ? _b2 : _ConsoleInstrumentation.defaultDisabledLevels).includes(level);
    }).forEach((level) => {
      console[level] = (...args) => {
        var _a2, _b2;
        try {
          if (level === LogLevel.ERROR && !((_a2 = this.options) === null || _a2 === void 0 ? void 0 : _a2.consoleErrorAsLog)) {
            const { value, type, stackFrames } = getDetailsFromConsoleErrorArgs(args, this.errorSerializer);
            if (value && !type && !stackFrames) {
              this.api.pushError(new Error(_ConsoleInstrumentation.consoleErrorPrefix + value));
              return;
            }
            this.api.pushError(new Error(_ConsoleInstrumentation.consoleErrorPrefix + value), { type, stackFrames });
          } else if (level === LogLevel.ERROR && ((_b2 = this.options) === null || _b2 === void 0 ? void 0 : _b2.consoleErrorAsLog)) {
            const { value, type, stackFrames } = getDetailsFromConsoleErrorArgs(args, this.errorSerializer);
            this.api.pushLog(value ? [_ConsoleInstrumentation.consoleErrorPrefix + value] : args, {
              level,
              context: {
                value: value !== null && value !== void 0 ? value : "",
                type: type !== null && type !== void 0 ? type : "",
                stackFrames: (stackFrames === null || stackFrames === void 0 ? void 0 : stackFrames.length) ? defaultErrorArgsSerializer(stackFrames) : ""
              }
            });
          } else {
            this.api.pushLog(args, { level });
          }
        } catch (err) {
          this.logError(err);
        } finally {
          this.unpatchedConsole[level](...args);
        }
      };
    });
  }
};
ConsoleInstrumentation.defaultDisabledLevels = [LogLevel.DEBUG, LogLevel.TRACE, LogLevel.LOG];
ConsoleInstrumentation.consoleErrorPrefix = "console.error: ";

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/registerOnerror.js
function registerOnerror(api) {
  const oldOnerror = window.onerror;
  window.onerror = (...args) => {
    try {
      const { value, type, stackFrames } = getDetailsFromErrorArgs(args);
      const originalError = args[4];
      if (value) {
        const options = { type, stackFrames };
        if (originalError != null) {
          options.originalError = originalError;
        }
        api.pushError(new Error(value), options);
      }
    } finally {
      oldOnerror === null || oldOnerror === void 0 ? void 0 : oldOnerror.apply(window, args);
    }
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/registerOnunhandledrejection.js
function registerOnunhandledrejection(api) {
  window.addEventListener("unhandledrejection", (evt) => {
    var _a, _b;
    let error = evt;
    if (error.reason) {
      error = evt.reason;
    } else if ((_a = evt.detail) === null || _a === void 0 ? void 0 : _a.reason) {
      error = (_b = evt.detail) === null || _b === void 0 ? void 0 : _b.reason;
    }
    let value;
    let type;
    let stackFrames = [];
    if (isPrimitive(error)) {
      value = `${primitiveUnhandledValue} ${String(error)}`;
      type = primitiveUnhandledType;
    } else {
      [value, type, stackFrames] = getErrorDetails(error);
    }
    if (value) {
      api.pushError(new Error(value), { type, stackFrames });
    }
  });
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/errors/instrumentation.js
var ErrorsInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super(...arguments);
    this.name = "@grafana/faro-web-sdk:instrumentation-errors";
    this.version = VERSION;
  }
  initialize() {
    this.logDebug("Initializing");
    registerOnerror(this.api);
    registerOnunhandledrejection(this.api);
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/view/instrumentation.js
var ViewInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super(...arguments);
    this.name = "@grafana/faro-web-sdk:instrumentation-view";
    this.version = VERSION;
  }
  sendViewChangedEvent(meta) {
    var _a, _b, _c, _d;
    const view = meta.view;
    if (view && view.name !== ((_a = this.notifiedView) === null || _a === void 0 ? void 0 : _a.name)) {
      this.api.pushEvent(EVENT_VIEW_CHANGED, {
        fromView: (_c = (_b = this.notifiedView) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : unknownString,
        toView: (_d = view.name) !== null && _d !== void 0 ? _d : unknownString
      }, void 0, { skipDedupe: true });
      this.notifiedView = view;
    }
  }
  initialize() {
    this.metas.addListener(this.sendViewChangedEvent.bind(this));
  }
};

// node_modules/.pnpm/web-vitals@4.2.4/node_modules/web-vitals/dist/web-vitals.js
var e;
var n;
var t;
var r;
var i;
var o = -1;
var a = function(e4) {
  addEventListener("pageshow", (function(n3) {
    n3.persisted && (o = n3.timeStamp, e4(n3));
  }), true);
};
var c = function() {
  var e4 = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (e4 && e4.responseStart > 0 && e4.responseStart < performance.now()) return e4;
};
var u = function() {
  var e4 = c();
  return e4 && e4.activationStart || 0;
};
var f = function(e4, n3) {
  var t4 = c(), r3 = "navigate";
  o >= 0 ? r3 = "back-forward-cache" : t4 && (document.prerendering || u() > 0 ? r3 = "prerender" : document.wasDiscarded ? r3 = "restore" : t4.type && (r3 = t4.type.replace(/_/g, "-")));
  return { name: e4, value: void 0 === n3 ? -1 : n3, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: r3 };
};
var s = function(e4, n3, t4) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e4)) {
      var r3 = new PerformanceObserver((function(e5) {
        Promise.resolve().then((function() {
          n3(e5.getEntries());
        }));
      }));
      return r3.observe(Object.assign({ type: e4, buffered: true }, t4 || {})), r3;
    }
  } catch (e5) {
  }
};
var d = function(e4, n3, t4, r3) {
  var i3, o3;
  return function(a3) {
    n3.value >= 0 && (a3 || r3) && ((o3 = n3.value - (i3 || 0)) || void 0 === i3) && (i3 = n3.value, n3.delta = o3, n3.rating = (function(e5, n4) {
      return e5 > n4[1] ? "poor" : e5 > n4[0] ? "needs-improvement" : "good";
    })(n3.value, t4), e4(n3));
  };
};
var l = function(e4) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return e4();
    }));
  }));
};
var p = function(e4) {
  document.addEventListener("visibilitychange", (function() {
    "hidden" === document.visibilityState && e4();
  }));
};
var v = function(e4) {
  var n3 = false;
  return function() {
    n3 || (e4(), n3 = true);
  };
};
var m = -1;
var h = function() {
  return "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
};
var g = function(e4) {
  "hidden" === document.visibilityState && m > -1 && (m = "visibilitychange" === e4.type ? e4.timeStamp : 0, T());
};
var y = function() {
  addEventListener("visibilitychange", g, true), addEventListener("prerenderingchange", g, true);
};
var T = function() {
  removeEventListener("visibilitychange", g, true), removeEventListener("prerenderingchange", g, true);
};
var E = function() {
  return m < 0 && (m = h(), y(), a((function() {
    setTimeout((function() {
      m = h(), y();
    }), 0);
  }))), { get firstHiddenTime() {
    return m;
  } };
};
var C = function(e4) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return e4();
  }), true) : e4();
};
var b = [1800, 3e3];
var S = function(e4, n3) {
  n3 = n3 || {}, C((function() {
    var t4, r3 = E(), i3 = f("FCP"), o3 = s("paint", (function(e5) {
      e5.forEach((function(e6) {
        "first-contentful-paint" === e6.name && (o3.disconnect(), e6.startTime < r3.firstHiddenTime && (i3.value = Math.max(e6.startTime - u(), 0), i3.entries.push(e6), t4(true)));
      }));
    }));
    o3 && (t4 = d(e4, i3, b, n3.reportAllChanges), a((function(r4) {
      i3 = f("FCP"), t4 = d(e4, i3, b, n3.reportAllChanges), l((function() {
        i3.value = performance.now() - r4.timeStamp, t4(true);
      }));
    })));
  }));
};
var L = [0.1, 0.25];
var w = function(e4, n3) {
  n3 = n3 || {}, S(v((function() {
    var t4, r3 = f("CLS", 0), i3 = 0, o3 = [], c3 = function(e5) {
      e5.forEach((function(e6) {
        if (!e6.hadRecentInput) {
          var n4 = o3[0], t5 = o3[o3.length - 1];
          i3 && e6.startTime - t5.startTime < 1e3 && e6.startTime - n4.startTime < 5e3 ? (i3 += e6.value, o3.push(e6)) : (i3 = e6.value, o3 = [e6]);
        }
      })), i3 > r3.value && (r3.value = i3, r3.entries = o3, t4());
    }, u3 = s("layout-shift", c3);
    u3 && (t4 = d(e4, r3, L, n3.reportAllChanges), p((function() {
      c3(u3.takeRecords()), t4(true);
    })), a((function() {
      i3 = 0, r3 = f("CLS", 0), t4 = d(e4, r3, L, n3.reportAllChanges), l((function() {
        return t4();
      }));
    })), setTimeout(t4, 0));
  })));
};
var A = 0;
var I = 1 / 0;
var P = 0;
var M = function(e4) {
  e4.forEach((function(e5) {
    e5.interactionId && (I = Math.min(I, e5.interactionId), P = Math.max(P, e5.interactionId), A = P ? (P - I) / 7 + 1 : 0);
  }));
};
var k = function() {
  return e ? A : performance.interactionCount || 0;
};
var F = function() {
  "interactionCount" in performance || e || (e = s("event", M, { type: "event", buffered: true, durationThreshold: 0 }));
};
var D = [];
var x = /* @__PURE__ */ new Map();
var R = 0;
var B = function() {
  var e4 = Math.min(D.length - 1, Math.floor((k() - R) / 50));
  return D[e4];
};
var H = [];
var q = function(e4) {
  if (H.forEach((function(n4) {
    return n4(e4);
  })), e4.interactionId || "first-input" === e4.entryType) {
    var n3 = D[D.length - 1], t4 = x.get(e4.interactionId);
    if (t4 || D.length < 10 || e4.duration > n3.latency) {
      if (t4) e4.duration > t4.latency ? (t4.entries = [e4], t4.latency = e4.duration) : e4.duration === t4.latency && e4.startTime === t4.entries[0].startTime && t4.entries.push(e4);
      else {
        var r3 = { id: e4.interactionId, latency: e4.duration, entries: [e4] };
        x.set(r3.id, r3), D.push(r3);
      }
      D.sort((function(e5, n4) {
        return n4.latency - e5.latency;
      })), D.length > 10 && D.splice(10).forEach((function(e5) {
        return x.delete(e5.id);
      }));
    }
  }
};
var O = function(e4) {
  var n3 = self.requestIdleCallback || self.setTimeout, t4 = -1;
  return e4 = v(e4), "hidden" === document.visibilityState ? e4() : (t4 = n3(e4), p(e4)), t4;
};
var N = [200, 500];
var j = function(e4, n3) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (n3 = n3 || {}, C((function() {
    var t4;
    F();
    var r3, i3 = f("INP"), o3 = function(e5) {
      O((function() {
        e5.forEach(q);
        var n4 = B();
        n4 && n4.latency !== i3.value && (i3.value = n4.latency, i3.entries = n4.entries, r3());
      }));
    }, c3 = s("event", o3, { durationThreshold: null !== (t4 = n3.durationThreshold) && void 0 !== t4 ? t4 : 40 });
    r3 = d(e4, i3, N, n3.reportAllChanges), c3 && (c3.observe({ type: "first-input", buffered: true }), p((function() {
      o3(c3.takeRecords()), r3(true);
    })), a((function() {
      R = k(), D.length = 0, x.clear(), i3 = f("INP"), r3 = d(e4, i3, N, n3.reportAllChanges);
    })));
  })));
};
var _ = [2500, 4e3];
var z = {};
var G = function(e4, n3) {
  n3 = n3 || {}, C((function() {
    var t4, r3 = E(), i3 = f("LCP"), o3 = function(e5) {
      n3.reportAllChanges || (e5 = e5.slice(-1)), e5.forEach((function(e6) {
        e6.startTime < r3.firstHiddenTime && (i3.value = Math.max(e6.startTime - u(), 0), i3.entries = [e6], t4());
      }));
    }, c3 = s("largest-contentful-paint", o3);
    if (c3) {
      t4 = d(e4, i3, _, n3.reportAllChanges);
      var m3 = v((function() {
        z[i3.id] || (o3(c3.takeRecords()), c3.disconnect(), z[i3.id] = true, t4(true));
      }));
      ["keydown", "click"].forEach((function(e5) {
        addEventListener(e5, (function() {
          return O(m3);
        }), { once: true, capture: true });
      })), p(m3), a((function(r4) {
        i3 = f("LCP"), t4 = d(e4, i3, _, n3.reportAllChanges), l((function() {
          i3.value = performance.now() - r4.timeStamp, z[i3.id] = true, t4(true);
        }));
      }));
    }
  }));
};
var J = [800, 1800];
var K = function e2(n3) {
  document.prerendering ? C((function() {
    return e2(n3);
  })) : "complete" !== document.readyState ? addEventListener("load", (function() {
    return e2(n3);
  }), true) : setTimeout(n3, 0);
};
var Q = function(e4, n3) {
  n3 = n3 || {};
  var t4 = f("TTFB"), r3 = d(e4, t4, J, n3.reportAllChanges);
  K((function() {
    var i3 = c();
    i3 && (t4.value = Math.max(i3.responseStart - u(), 0), t4.entries = [i3], r3(true), a((function() {
      t4 = f("TTFB", 0), (r3 = d(e4, t4, J, n3.reportAllChanges))(true);
    })));
  }));
};
var U = { passive: true, capture: true };
var V = /* @__PURE__ */ new Date();
var W = function(e4, i3) {
  n || (n = i3, t = e4, r = /* @__PURE__ */ new Date(), Z(removeEventListener), X());
};
var X = function() {
  if (t >= 0 && t < r - V) {
    var e4 = { entryType: "first-input", name: n.type, target: n.target, cancelable: n.cancelable, startTime: n.timeStamp, processingStart: n.timeStamp + t };
    i.forEach((function(n3) {
      n3(e4);
    })), i = [];
  }
};
var Y = function(e4) {
  if (e4.cancelable) {
    var n3 = (e4.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - e4.timeStamp;
    "pointerdown" == e4.type ? (function(e5, n4) {
      var t4 = function() {
        W(e5, n4), i3();
      }, r3 = function() {
        i3();
      }, i3 = function() {
        removeEventListener("pointerup", t4, U), removeEventListener("pointercancel", r3, U);
      };
      addEventListener("pointerup", t4, U), addEventListener("pointercancel", r3, U);
    })(n3, e4) : W(n3, e4);
  }
};
var Z = function(e4) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(n3) {
    return e4(n3, Y, U);
  }));
};
var $ = [100, 300];
var ee = function(e4, r3) {
  r3 = r3 || {}, C((function() {
    var o3, c3 = E(), u3 = f("FID"), l3 = function(e5) {
      e5.startTime < c3.firstHiddenTime && (u3.value = e5.processingStart - e5.startTime, u3.entries.push(e5), o3(true));
    }, m3 = function(e5) {
      e5.forEach(l3);
    }, h3 = s("first-input", m3);
    o3 = d(e4, u3, $, r3.reportAllChanges), h3 && (p(v((function() {
      m3(h3.takeRecords()), h3.disconnect();
    }))), a((function() {
      var a3;
      u3 = f("FID"), o3 = d(e4, u3, $, r3.reportAllChanges), i = [], t = -1, n = null, Z(addEventListener), a3 = l3, i.push(a3), X();
    })));
  }));
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/webVitals/webVitalsBasic.js
var WebVitalsBasic = class _WebVitalsBasic {
  constructor(pushMeasurement, webVitalConfig) {
    this.pushMeasurement = pushMeasurement;
    this.webVitalConfig = webVitalConfig;
  }
  initialize() {
    Object.entries(_WebVitalsBasic.mapping).forEach(([indicator, executor]) => {
      var _a;
      executor((metric) => {
        this.pushMeasurement({
          type: "web-vitals",
          values: {
            [indicator]: metric.value
          }
        });
      }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
    });
  }
};
WebVitalsBasic.mapping = {
  cls: w,
  fcp: S,
  fid: ee,
  inp: j,
  lcp: G,
  ttfb: Q
};

// node_modules/.pnpm/web-vitals@4.2.4/node_modules/web-vitals/dist/web-vitals.attribution.js
var t2;
var e3;
var n2 = function() {
  var t4 = self.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  if (t4 && t4.responseStart > 0 && t4.responseStart < performance.now()) return t4;
};
var r2 = function(t4) {
  if ("loading" === document.readyState) return "loading";
  var e4 = n2();
  if (e4) {
    if (t4 < e4.domInteractive) return "loading";
    if (0 === e4.domContentLoadedEventStart || t4 < e4.domContentLoadedEventStart) return "dom-interactive";
    if (0 === e4.domComplete || t4 < e4.domComplete) return "dom-content-loaded";
  }
  return "complete";
};
var i2 = function(t4) {
  var e4 = t4.nodeName;
  return 1 === t4.nodeType ? e4.toLowerCase() : e4.toUpperCase().replace(/^#/, "");
};
var a2 = function(t4, e4) {
  var n3 = "";
  try {
    for (; t4 && 9 !== t4.nodeType; ) {
      var r3 = t4, a3 = r3.id ? "#" + r3.id : i2(r3) + (r3.classList && r3.classList.value && r3.classList.value.trim() && r3.classList.value.trim().length ? "." + r3.classList.value.trim().replace(/\s+/g, ".") : "");
      if (n3.length + a3.length > (e4 || 100) - 1) return n3 || a3;
      if (n3 = n3 ? a3 + ">" + n3 : a3, r3.id) break;
      t4 = r3.parentNode;
    }
  } catch (t5) {
  }
  return n3;
};
var o2 = -1;
var c2 = function() {
  return o2;
};
var u2 = function(t4) {
  addEventListener("pageshow", (function(e4) {
    e4.persisted && (o2 = e4.timeStamp, t4(e4));
  }), true);
};
var s2 = function() {
  var t4 = n2();
  return t4 && t4.activationStart || 0;
};
var f2 = function(t4, e4) {
  var r3 = n2(), i3 = "navigate";
  c2() >= 0 ? i3 = "back-forward-cache" : r3 && (document.prerendering || s2() > 0 ? i3 = "prerender" : document.wasDiscarded ? i3 = "restore" : r3.type && (i3 = r3.type.replace(/_/g, "-")));
  return { name: t4, value: void 0 === e4 ? -1 : e4, rating: "good", delta: 0, entries: [], id: "v4-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: i3 };
};
var d2 = function(t4, e4, n3) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(t4)) {
      var r3 = new PerformanceObserver((function(t5) {
        Promise.resolve().then((function() {
          e4(t5.getEntries());
        }));
      }));
      return r3.observe(Object.assign({ type: t4, buffered: true }, n3 || {})), r3;
    }
  } catch (t5) {
  }
};
var l2 = function(t4, e4, n3, r3) {
  var i3, a3;
  return function(o3) {
    e4.value >= 0 && (o3 || r3) && ((a3 = e4.value - (i3 || 0)) || void 0 === i3) && (i3 = e4.value, e4.delta = a3, e4.rating = (function(t5, e5) {
      return t5 > e5[1] ? "poor" : t5 > e5[0] ? "needs-improvement" : "good";
    })(e4.value, n3), t4(e4));
  };
};
var m2 = function(t4) {
  requestAnimationFrame((function() {
    return requestAnimationFrame((function() {
      return t4();
    }));
  }));
};
var p2 = function(t4) {
  document.addEventListener("visibilitychange", (function() {
    "hidden" === document.visibilityState && t4();
  }));
};
var v2 = function(t4) {
  var e4 = false;
  return function() {
    e4 || (t4(), e4 = true);
  };
};
var g2 = -1;
var h2 = function() {
  return "hidden" !== document.visibilityState || document.prerendering ? 1 / 0 : 0;
};
var T2 = function(t4) {
  "hidden" === document.visibilityState && g2 > -1 && (g2 = "visibilitychange" === t4.type ? t4.timeStamp : 0, E2());
};
var y2 = function() {
  addEventListener("visibilitychange", T2, true), addEventListener("prerenderingchange", T2, true);
};
var E2 = function() {
  removeEventListener("visibilitychange", T2, true), removeEventListener("prerenderingchange", T2, true);
};
var S2 = function() {
  return g2 < 0 && (g2 = h2(), y2(), u2((function() {
    setTimeout((function() {
      g2 = h2(), y2();
    }), 0);
  }))), { get firstHiddenTime() {
    return g2;
  } };
};
var b2 = function(t4) {
  document.prerendering ? addEventListener("prerenderingchange", (function() {
    return t4();
  }), true) : t4();
};
var L2 = [1800, 3e3];
var C2 = function(t4, e4) {
  e4 = e4 || {}, b2((function() {
    var n3, r3 = S2(), i3 = f2("FCP"), a3 = d2("paint", (function(t5) {
      t5.forEach((function(t6) {
        "first-contentful-paint" === t6.name && (a3.disconnect(), t6.startTime < r3.firstHiddenTime && (i3.value = Math.max(t6.startTime - s2(), 0), i3.entries.push(t6), n3(true)));
      }));
    }));
    a3 && (n3 = l2(t4, i3, L2, e4.reportAllChanges), u2((function(r4) {
      i3 = f2("FCP"), n3 = l2(t4, i3, L2, e4.reportAllChanges), m2((function() {
        i3.value = performance.now() - r4.timeStamp, n3(true);
      }));
    })));
  }));
};
var M2 = [0.1, 0.25];
var D2 = function(t4, e4) {
  !(function(t5, e5) {
    e5 = e5 || {}, C2(v2((function() {
      var n3, r3 = f2("CLS", 0), i3 = 0, a3 = [], o3 = function(t6) {
        t6.forEach((function(t7) {
          if (!t7.hadRecentInput) {
            var e6 = a3[0], n4 = a3[a3.length - 1];
            i3 && t7.startTime - n4.startTime < 1e3 && t7.startTime - e6.startTime < 5e3 ? (i3 += t7.value, a3.push(t7)) : (i3 = t7.value, a3 = [t7]);
          }
        })), i3 > r3.value && (r3.value = i3, r3.entries = a3, n3());
      }, c3 = d2("layout-shift", o3);
      c3 && (n3 = l2(t5, r3, M2, e5.reportAllChanges), p2((function() {
        o3(c3.takeRecords()), n3(true);
      })), u2((function() {
        i3 = 0, r3 = f2("CLS", 0), n3 = l2(t5, r3, M2, e5.reportAllChanges), m2((function() {
          return n3();
        }));
      })), setTimeout(n3, 0));
    })));
  })((function(e5) {
    var n3 = (function(t5) {
      var e6, n4 = {};
      if (t5.entries.length) {
        var i3 = t5.entries.reduce((function(t6, e7) {
          return t6 && t6.value > e7.value ? t6 : e7;
        }));
        if (i3 && i3.sources && i3.sources.length) {
          var o3 = (e6 = i3.sources).find((function(t6) {
            return t6.node && 1 === t6.node.nodeType;
          })) || e6[0];
          o3 && (n4 = { largestShiftTarget: a2(o3.node), largestShiftTime: i3.startTime, largestShiftValue: i3.value, largestShiftSource: o3, largestShiftEntry: i3, loadState: r2(i3.startTime) });
        }
      }
      return Object.assign(t5, { attribution: n4 });
    })(e5);
    t4(n3);
  }), e4);
};
var w2 = function(t4, e4) {
  C2((function(e5) {
    var i3 = (function(t5) {
      var e6 = { timeToFirstByte: 0, firstByteToFCP: t5.value, loadState: r2(c2()) };
      if (t5.entries.length) {
        var i4 = n2(), a3 = t5.entries[t5.entries.length - 1];
        if (i4) {
          var o3 = i4.activationStart || 0, u3 = Math.max(0, i4.responseStart - o3);
          e6 = { timeToFirstByte: u3, firstByteToFCP: t5.value - u3, loadState: r2(t5.entries[0].startTime), navigationEntry: i4, fcpEntry: a3 };
        }
      }
      return Object.assign(t5, { attribution: e6 });
    })(e5);
    t4(i3);
  }), e4);
};
var x2 = 0;
var I2 = 1 / 0;
var k2 = 0;
var A2 = function(t4) {
  t4.forEach((function(t5) {
    t5.interactionId && (I2 = Math.min(I2, t5.interactionId), k2 = Math.max(k2, t5.interactionId), x2 = k2 ? (k2 - I2) / 7 + 1 : 0);
  }));
};
var F2 = function() {
  return t2 ? x2 : performance.interactionCount || 0;
};
var P2 = function() {
  "interactionCount" in performance || t2 || (t2 = d2("event", A2, { type: "event", buffered: true, durationThreshold: 0 }));
};
var B2 = [];
var O2 = /* @__PURE__ */ new Map();
var R2 = 0;
var j2 = function() {
  var t4 = Math.min(B2.length - 1, Math.floor((F2() - R2) / 50));
  return B2[t4];
};
var q2 = [];
var H2 = function(t4) {
  if (q2.forEach((function(e5) {
    return e5(t4);
  })), t4.interactionId || "first-input" === t4.entryType) {
    var e4 = B2[B2.length - 1], n3 = O2.get(t4.interactionId);
    if (n3 || B2.length < 10 || t4.duration > e4.latency) {
      if (n3) t4.duration > n3.latency ? (n3.entries = [t4], n3.latency = t4.duration) : t4.duration === n3.latency && t4.startTime === n3.entries[0].startTime && n3.entries.push(t4);
      else {
        var r3 = { id: t4.interactionId, latency: t4.duration, entries: [t4] };
        O2.set(r3.id, r3), B2.push(r3);
      }
      B2.sort((function(t5, e5) {
        return e5.latency - t5.latency;
      })), B2.length > 10 && B2.splice(10).forEach((function(t5) {
        return O2.delete(t5.id);
      }));
    }
  }
};
var N2 = function(t4) {
  var e4 = self.requestIdleCallback || self.setTimeout, n3 = -1;
  return t4 = v2(t4), "hidden" === document.visibilityState ? t4() : (n3 = e4(t4), p2(t4)), n3;
};
var W2 = [200, 500];
var z2 = function(t4, e4) {
  "PerformanceEventTiming" in self && "interactionId" in PerformanceEventTiming.prototype && (e4 = e4 || {}, b2((function() {
    var n3;
    P2();
    var r3, i3 = f2("INP"), a3 = function(t5) {
      N2((function() {
        t5.forEach(H2);
        var e5 = j2();
        e5 && e5.latency !== i3.value && (i3.value = e5.latency, i3.entries = e5.entries, r3());
      }));
    }, o3 = d2("event", a3, { durationThreshold: null !== (n3 = e4.durationThreshold) && void 0 !== n3 ? n3 : 40 });
    r3 = l2(t4, i3, W2, e4.reportAllChanges), o3 && (o3.observe({ type: "first-input", buffered: true }), p2((function() {
      a3(o3.takeRecords()), r3(true);
    })), u2((function() {
      R2 = F2(), B2.length = 0, O2.clear(), i3 = f2("INP"), r3 = l2(t4, i3, W2, e4.reportAllChanges);
    })));
  })));
};
var U2 = [];
var V2 = [];
var _2 = 0;
var G2 = /* @__PURE__ */ new WeakMap();
var J2 = /* @__PURE__ */ new Map();
var K2 = -1;
var Q2 = function(t4) {
  U2 = U2.concat(t4), X2();
};
var X2 = function() {
  K2 < 0 && (K2 = N2(Y2));
};
var Y2 = function() {
  J2.size > 10 && J2.forEach((function(t5, e5) {
    O2.has(e5) || J2.delete(e5);
  }));
  var t4 = B2.map((function(t5) {
    return G2.get(t5.entries[0]);
  })), e4 = V2.length - 50;
  V2 = V2.filter((function(n4, r4) {
    return r4 >= e4 || t4.includes(n4);
  }));
  for (var n3 = /* @__PURE__ */ new Set(), r3 = 0; r3 < V2.length; r3++) {
    var i3 = V2[r3];
    nt(i3.startTime, i3.processingEnd).forEach((function(t5) {
      n3.add(t5);
    }));
  }
  var a3 = U2.length - 1 - 50;
  U2 = U2.filter((function(t5, e5) {
    return t5.startTime > _2 && e5 > a3 || n3.has(t5);
  })), K2 = -1;
};
q2.push((function(t4) {
  t4.interactionId && t4.target && !J2.has(t4.interactionId) && J2.set(t4.interactionId, t4.target);
}), (function(t4) {
  var e4, n3 = t4.startTime + t4.duration;
  _2 = Math.max(_2, t4.processingEnd);
  for (var r3 = V2.length - 1; r3 >= 0; r3--) {
    var i3 = V2[r3];
    if (Math.abs(n3 - i3.renderTime) <= 8) {
      (e4 = i3).startTime = Math.min(t4.startTime, e4.startTime), e4.processingStart = Math.min(t4.processingStart, e4.processingStart), e4.processingEnd = Math.max(t4.processingEnd, e4.processingEnd), e4.entries.push(t4);
      break;
    }
  }
  e4 || (e4 = { startTime: t4.startTime, processingStart: t4.processingStart, processingEnd: t4.processingEnd, renderTime: n3, entries: [t4] }, V2.push(e4)), (t4.interactionId || "first-input" === t4.entryType) && G2.set(t4, e4), X2();
}));
var Z2;
var $2;
var tt;
var et;
var nt = function(t4, e4) {
  for (var n3, r3 = [], i3 = 0; n3 = U2[i3]; i3++) if (!(n3.startTime + n3.duration < t4)) {
    if (n3.startTime > e4) break;
    r3.push(n3);
  }
  return r3;
};
var rt = function(t4, n3) {
  e3 || (e3 = d2("long-animation-frame", Q2)), z2((function(e4) {
    var n4 = (function(t5) {
      var e5 = t5.entries[0], n5 = G2.get(e5), i3 = e5.processingStart, o3 = n5.processingEnd, c3 = n5.entries.sort((function(t6, e6) {
        return t6.processingStart - e6.processingStart;
      })), u3 = nt(e5.startTime, o3), s3 = t5.entries.find((function(t6) {
        return t6.target;
      })), f3 = s3 && s3.target || J2.get(e5.interactionId), d3 = [e5.startTime + e5.duration, o3].concat(u3.map((function(t6) {
        return t6.startTime + t6.duration;
      }))), l3 = Math.max.apply(Math, d3), m3 = { interactionTarget: a2(f3), interactionTargetElement: f3, interactionType: e5.name.startsWith("key") ? "keyboard" : "pointer", interactionTime: e5.startTime, nextPaintTime: l3, processedEventEntries: c3, longAnimationFrameEntries: u3, inputDelay: i3 - e5.startTime, processingDuration: o3 - i3, presentationDelay: Math.max(l3 - o3, 0), loadState: r2(e5.startTime) };
      return Object.assign(t5, { attribution: m3 });
    })(e4);
    t4(n4);
  }), n3);
};
var it = [2500, 4e3];
var at = {};
var ot = function(t4, e4) {
  !(function(t5, e5) {
    e5 = e5 || {}, b2((function() {
      var n3, r3 = S2(), i3 = f2("LCP"), a3 = function(t6) {
        e5.reportAllChanges || (t6 = t6.slice(-1)), t6.forEach((function(t7) {
          t7.startTime < r3.firstHiddenTime && (i3.value = Math.max(t7.startTime - s2(), 0), i3.entries = [t7], n3());
        }));
      }, o3 = d2("largest-contentful-paint", a3);
      if (o3) {
        n3 = l2(t5, i3, it, e5.reportAllChanges);
        var c3 = v2((function() {
          at[i3.id] || (a3(o3.takeRecords()), o3.disconnect(), at[i3.id] = true, n3(true));
        }));
        ["keydown", "click"].forEach((function(t6) {
          addEventListener(t6, (function() {
            return N2(c3);
          }), { once: true, capture: true });
        })), p2(c3), u2((function(r4) {
          i3 = f2("LCP"), n3 = l2(t5, i3, it, e5.reportAllChanges), m2((function() {
            i3.value = performance.now() - r4.timeStamp, at[i3.id] = true, n3(true);
          }));
        }));
      }
    }));
  })((function(e5) {
    var r3 = (function(t5) {
      var e6 = { timeToFirstByte: 0, resourceLoadDelay: 0, resourceLoadDuration: 0, elementRenderDelay: t5.value };
      if (t5.entries.length) {
        var r4 = n2();
        if (r4) {
          var i3 = r4.activationStart || 0, o3 = t5.entries[t5.entries.length - 1], c3 = o3.url && performance.getEntriesByType("resource").filter((function(t6) {
            return t6.name === o3.url;
          }))[0], u3 = Math.max(0, r4.responseStart - i3), s3 = Math.max(u3, c3 ? (c3.requestStart || c3.startTime) - i3 : 0), f3 = Math.max(s3, c3 ? c3.responseEnd - i3 : 0), d3 = Math.max(f3, o3.startTime - i3);
          e6 = { element: a2(o3.element), timeToFirstByte: u3, resourceLoadDelay: s3 - u3, resourceLoadDuration: f3 - s3, elementRenderDelay: d3 - f3, navigationEntry: r4, lcpEntry: o3 }, o3.url && (e6.url = o3.url), c3 && (e6.lcpResourceEntry = c3);
        }
      }
      return Object.assign(t5, { attribution: e6 });
    })(e5);
    t4(r3);
  }), e4);
};
var ct = [800, 1800];
var ut = function t3(e4) {
  document.prerendering ? b2((function() {
    return t3(e4);
  })) : "complete" !== document.readyState ? addEventListener("load", (function() {
    return t3(e4);
  }), true) : setTimeout(e4, 0);
};
var st = function(t4, e4) {
  e4 = e4 || {};
  var r3 = f2("TTFB"), i3 = l2(t4, r3, ct, e4.reportAllChanges);
  ut((function() {
    var a3 = n2();
    a3 && (r3.value = Math.max(a3.responseStart - s2(), 0), r3.entries = [a3], i3(true), u2((function() {
      r3 = f2("TTFB", 0), (i3 = l2(t4, r3, ct, e4.reportAllChanges))(true);
    })));
  }));
};
var ft = function(t4, e4) {
  st((function(e5) {
    var n3 = (function(t5) {
      var e6 = { waitingDuration: 0, cacheDuration: 0, dnsDuration: 0, connectionDuration: 0, requestDuration: 0 };
      if (t5.entries.length) {
        var n4 = t5.entries[0], r3 = n4.activationStart || 0, i3 = Math.max((n4.workerStart || n4.fetchStart) - r3, 0), a3 = Math.max(n4.domainLookupStart - r3, 0), o3 = Math.max(n4.connectStart - r3, 0), c3 = Math.max(n4.connectEnd - r3, 0);
        e6 = { waitingDuration: i3, cacheDuration: a3 - i3, dnsDuration: o3 - a3, connectionDuration: c3 - o3, requestDuration: t5.value - c3, navigationEntry: n4 };
      }
      return Object.assign(t5, { attribution: e6 });
    })(e5);
    t4(n3);
  }), e4);
};
var dt = { passive: true, capture: true };
var lt = /* @__PURE__ */ new Date();
var mt = function(t4, e4) {
  Z2 || (Z2 = e4, $2 = t4, tt = /* @__PURE__ */ new Date(), gt(removeEventListener), pt());
};
var pt = function() {
  if ($2 >= 0 && $2 < tt - lt) {
    var t4 = { entryType: "first-input", name: Z2.type, target: Z2.target, cancelable: Z2.cancelable, startTime: Z2.timeStamp, processingStart: Z2.timeStamp + $2 };
    et.forEach((function(e4) {
      e4(t4);
    })), et = [];
  }
};
var vt = function(t4) {
  if (t4.cancelable) {
    var e4 = (t4.timeStamp > 1e12 ? /* @__PURE__ */ new Date() : performance.now()) - t4.timeStamp;
    "pointerdown" == t4.type ? (function(t5, e5) {
      var n3 = function() {
        mt(t5, e5), i3();
      }, r3 = function() {
        i3();
      }, i3 = function() {
        removeEventListener("pointerup", n3, dt), removeEventListener("pointercancel", r3, dt);
      };
      addEventListener("pointerup", n3, dt), addEventListener("pointercancel", r3, dt);
    })(e4, t4) : mt(e4, t4);
  }
};
var gt = function(t4) {
  ["mousedown", "keydown", "touchstart", "pointerdown"].forEach((function(e4) {
    return t4(e4, vt, dt);
  }));
};
var ht = [100, 300];
var Tt = function(t4, e4) {
  e4 = e4 || {}, b2((function() {
    var n3, r3 = S2(), i3 = f2("FID"), a3 = function(t5) {
      t5.startTime < r3.firstHiddenTime && (i3.value = t5.processingStart - t5.startTime, i3.entries.push(t5), n3(true));
    }, o3 = function(t5) {
      t5.forEach(a3);
    }, c3 = d2("first-input", o3);
    n3 = l2(t4, i3, ht, e4.reportAllChanges), c3 && (p2(v2((function() {
      o3(c3.takeRecords()), c3.disconnect();
    }))), u2((function() {
      var r4;
      i3 = f2("FID"), n3 = l2(t4, i3, ht, e4.reportAllChanges), et = [], $2 = -1, Z2 = null, gt(addEventListener), r4 = a3, et.push(r4), pt();
    })));
  }));
};
var yt = function(t4, e4) {
  Tt((function(e5) {
    var n3 = (function(t5) {
      var e6 = t5.entries[0], n4 = { eventTarget: a2(e6.target), eventType: e6.name, eventTime: e6.startTime, eventEntry: e6, loadState: r2(e6.startTime) };
      return Object.assign(t5, { attribution: n4 });
    })(e5);
    t4(n3);
  }), e4);
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/instrumentationConstants.js
var NAVIGATION_ID_STORAGE_KEY = "com.grafana.faro.lastNavigationId";

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/webVitals/webVitalsWithAttribution.js
var loadStateKey = "load_state";
var timeToFirstByteKey = "time_to_first_byte";
var WebVitalsWithAttribution = class {
  constructor(corePushMeasurement, webVitalConfig) {
    this.corePushMeasurement = corePushMeasurement;
    this.webVitalConfig = webVitalConfig;
  }
  initialize() {
    this.measureCLS();
    this.measureFCP();
    this.measureFID();
    this.measureINP();
    this.measureLCP();
    this.measureTTFB();
  }
  measureCLS() {
    var _a;
    D2((metric) => {
      const { loadState, largestShiftValue, largestShiftTime, largestShiftTarget } = metric.attribution;
      const values = this.buildInitialValues(metric);
      this.addIfPresent(values, "largest_shift_value", largestShiftValue);
      this.addIfPresent(values, "largest_shift_time", largestShiftTime);
      const context = this.buildInitialContext(metric);
      this.addIfPresent(context, loadStateKey, loadState);
      this.addIfPresent(context, "largest_shift_target", largestShiftTarget);
      this.pushMeasurement(values, context);
    }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
  }
  measureFCP() {
    var _a;
    w2((metric) => {
      const { firstByteToFCP, timeToFirstByte, loadState } = metric.attribution;
      const values = this.buildInitialValues(metric);
      this.addIfPresent(values, "first_byte_to_fcp", firstByteToFCP);
      this.addIfPresent(values, timeToFirstByteKey, timeToFirstByte);
      const context = this.buildInitialContext(metric);
      this.addIfPresent(context, loadStateKey, loadState);
      this.pushMeasurement(values, context);
    }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
  }
  measureFID() {
    var _a;
    yt((metric) => {
      const { eventTime, eventTarget, eventType, loadState } = metric.attribution;
      const values = this.buildInitialValues(metric);
      this.addIfPresent(values, "event_time", eventTime);
      const context = this.buildInitialContext(metric);
      this.addIfPresent(context, "event_target", eventTarget);
      this.addIfPresent(context, "event_type", eventType);
      this.addIfPresent(context, loadStateKey, loadState);
      this.pushMeasurement(values, context);
    }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
  }
  measureINP() {
    var _a;
    rt((metric) => {
      const { interactionTime, presentationDelay, inputDelay, processingDuration, nextPaintTime, loadState, interactionTarget, interactionType } = metric.attribution;
      const values = this.buildInitialValues(metric);
      this.addIfPresent(values, "interaction_time", interactionTime);
      this.addIfPresent(values, "presentation_delay", presentationDelay);
      this.addIfPresent(values, "input_delay", inputDelay);
      this.addIfPresent(values, "processing_duration", processingDuration);
      this.addIfPresent(values, "next_paint_time", nextPaintTime);
      const context = this.buildInitialContext(metric);
      this.addIfPresent(context, loadStateKey, loadState);
      this.addIfPresent(context, "interaction_target", interactionTarget);
      this.addIfPresent(context, "interaction_type", interactionType);
      this.pushMeasurement(values, context);
    }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
  }
  measureLCP() {
    var _a;
    ot((metric) => {
      const { elementRenderDelay, resourceLoadDelay, resourceLoadDuration, timeToFirstByte, element } = metric.attribution;
      const values = this.buildInitialValues(metric);
      this.addIfPresent(values, "element_render_delay", elementRenderDelay);
      this.addIfPresent(values, "resource_load_delay", resourceLoadDelay);
      this.addIfPresent(values, "resource_load_duration", resourceLoadDuration);
      this.addIfPresent(values, timeToFirstByteKey, timeToFirstByte);
      const context = this.buildInitialContext(metric);
      this.addIfPresent(context, "element", element);
      this.pushMeasurement(values, context);
    }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
  }
  measureTTFB() {
    var _a;
    ft((metric) => {
      const { dnsDuration, connectionDuration, requestDuration, waitingDuration, cacheDuration } = metric.attribution;
      const values = this.buildInitialValues(metric);
      this.addIfPresent(values, "dns_duration", dnsDuration);
      this.addIfPresent(values, "connection_duration", connectionDuration);
      this.addIfPresent(values, "request_duration", requestDuration);
      this.addIfPresent(values, "waiting_duration", waitingDuration);
      this.addIfPresent(values, "cache_duration", cacheDuration);
      const context = this.buildInitialContext(metric);
      this.pushMeasurement(values, context);
    }, { reportAllChanges: (_a = this.webVitalConfig) === null || _a === void 0 ? void 0 : _a.reportAllChanges });
  }
  buildInitialValues(metric) {
    const indicator = metric.name.toLowerCase();
    return {
      [indicator]: metric.value,
      delta: metric.delta
    };
  }
  buildInitialContext(metric) {
    var _a;
    const navigationEntryId = (_a = getItem(NAVIGATION_ID_STORAGE_KEY, webStorageType.session)) !== null && _a !== void 0 ? _a : unknownString;
    return {
      id: metric.id,
      rating: metric.rating,
      navigation_type: metric.navigationType,
      navigation_entry_id: navigationEntryId
    };
  }
  pushMeasurement(values, context) {
    const type = "web-vitals";
    this.corePushMeasurement({ type, values }, { context });
  }
  addIfPresent(source, key, metric) {
    if (metric) {
      source[key] = metric;
    }
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/webVitals/instrumentation.js
var WebVitalsInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super(...arguments);
    this.name = "@grafana/faro-web-sdk:instrumentation-web-vitals";
    this.version = VERSION;
  }
  initialize() {
    this.logDebug("Initializing");
    const webVitals = this.intializeWebVitalsInstrumentation();
    webVitals.initialize();
  }
  intializeWebVitalsInstrumentation() {
    var _a, _b, _c;
    if (((_a = this.config) === null || _a === void 0 ? void 0 : _a.trackWebVitalsAttribution) === false || ((_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.webVitalsInstrumentation) === null || _c === void 0 ? void 0 : _c.trackAttribution) === false) {
      return new WebVitalsBasic(this.api.pushMeasurement, this.config.webVitalsInstrumentation);
    }
    return new WebVitalsWithAttribution(this.api.pushMeasurement, this.config.webVitalsInstrumentation);
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/performance/performanceConstants.js
var NAVIGATION_ENTRY = "navigation";
var RESOURCE_ENTRY = "resource";

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/performance/performanceUtils.js
var w3cTraceparentFormat = /^00-[a-f0-9]{32}-[a-f0-9]{16}-[0-9]{1,2}$/;
function getSpanContextFromServerTiming(serverTimings = []) {
  for (const serverEntry of serverTimings) {
    if (serverEntry.name === "traceparent") {
      if (!w3cTraceparentFormat.test(serverEntry.description)) {
        continue;
      }
      const [, traceId, spanId] = serverEntry.description.split("-");
      if (traceId != null && spanId != null) {
        return { traceId, spanId };
      }
      break;
    }
  }
  return void 0;
}
function performanceObserverSupported() {
  return "PerformanceObserver" in window;
}
function onDocumentReady(handleReady) {
  if (document.readyState === "complete") {
    handleReady();
  } else {
    const readyStateCompleteHandler = () => {
      if (document.readyState === "complete") {
        handleReady();
        document.removeEventListener("readystatechange", readyStateCompleteHandler);
      }
    };
    document.addEventListener("readystatechange", readyStateCompleteHandler);
  }
}
function includePerformanceEntry(performanceEntryJSON, allowProps = {}) {
  for (const [allowPropKey, allowPropValue] of Object.entries(allowProps)) {
    const perfEntryPropVal = performanceEntryJSON[allowPropKey];
    if (perfEntryPropVal == null) {
      return false;
    }
    if (isArray(allowPropValue)) {
      return allowPropValue.includes(perfEntryPropVal);
    }
    return perfEntryPropVal === allowPropValue;
  }
  return true;
}
function createFaroResourceTiming(resourceEntryRaw) {
  const {
    connectEnd,
    connectStart,
    decodedBodySize,
    domainLookupEnd,
    domainLookupStart,
    duration,
    encodedBodySize,
    fetchStart,
    initiatorType,
    name,
    nextHopProtocol,
    redirectEnd,
    redirectStart,
    // @ts-expect-error the renderBlockingStatus property is not available in all browsers
    renderBlockingStatus: rbs,
    requestStart,
    responseEnd,
    responseStart,
    responseStatus,
    secureConnectionStart,
    transferSize,
    workerStart
  } = resourceEntryRaw;
  return {
    name,
    duration: toFaroPerformanceTimingString(duration),
    tcpHandshakeTime: toFaroPerformanceTimingString(connectEnd - connectStart),
    dnsLookupTime: toFaroPerformanceTimingString(domainLookupEnd - domainLookupStart),
    tlsNegotiationTime: toFaroPerformanceTimingString(connectEnd - secureConnectionStart),
    responseStatus: toFaroPerformanceTimingString(responseStatus),
    redirectTime: toFaroPerformanceTimingString(redirectEnd - redirectStart),
    requestTime: toFaroPerformanceTimingString(responseStart - requestStart),
    responseTime: toFaroPerformanceTimingString(responseEnd - responseStart),
    fetchTime: toFaroPerformanceTimingString(responseEnd - fetchStart),
    serviceWorkerTime: toFaroPerformanceTimingString(fetchStart - workerStart),
    decodedBodySize: toFaroPerformanceTimingString(decodedBodySize),
    encodedBodySize: toFaroPerformanceTimingString(encodedBodySize),
    cacheHitStatus: getCacheType(),
    renderBlockingStatus: toFaroPerformanceTimingString(rbs),
    protocol: nextHopProtocol,
    initiatorType,
    visibilityState: document.visibilityState,
    ttfb: toFaroPerformanceTimingString(responseStart - requestStart),
    transferSize: toFaroPerformanceTimingString(transferSize)
    // TODO: add in future iteration, ideally after nested objects are supported by the collector.
    // serverTiming: resourceEntryRaw.serverTiming,
  };
  function getCacheType() {
    let cacheType = "fullLoad";
    if (transferSize === 0) {
      if (decodedBodySize > 0) {
        cacheType = "cache";
      }
    } else {
      if (responseStatus != null) {
        if (responseStatus === 304) {
          cacheType = "conditionalFetch";
        }
      } else if (encodedBodySize > 0 && transferSize < encodedBodySize) {
        cacheType = "conditionalFetch";
      }
    }
    return cacheType;
  }
}
function createFaroNavigationTiming(navigationEntryRaw) {
  const { activationStart, domComplete, domContentLoadedEventEnd, domContentLoadedEventStart, domInteractive, fetchStart, loadEventEnd, loadEventStart, responseStart, type } = navigationEntryRaw;
  const parserStart = getDocumentParsingTime();
  return Object.assign(Object.assign({}, createFaroResourceTiming(navigationEntryRaw)), {
    pageLoadTime: toFaroPerformanceTimingString(domComplete - fetchStart),
    documentParsingTime: toFaroPerformanceTimingString(parserStart ? domInteractive - parserStart : null),
    domProcessingTime: toFaroPerformanceTimingString(domComplete - domInteractive),
    domContentLoadHandlerTime: toFaroPerformanceTimingString(domContentLoadedEventEnd - domContentLoadedEventStart),
    onLoadTime: toFaroPerformanceTimingString(loadEventEnd - loadEventStart),
    // For navigation entries we can calculate the TTFB based on activationStart. We overwrite the TTFB value coming with the resource entry.
    // For more accuracy on prerendered pages page we calculate relative top the activationStart instead of the start of the navigation.
    // clamp to 0 if activationStart occurs after first byte is received.
    ttfb: toFaroPerformanceTimingString(Math.max(responseStart - (activationStart !== null && activationStart !== void 0 ? activationStart : 0), 0)),
    type
  });
}
function getDocumentParsingTime() {
  var _a;
  if (((_a = performance.timing) === null || _a === void 0 ? void 0 : _a.domLoading) != null) {
    return performance.timing.domLoading - performance.timeOrigin;
  }
  return null;
}
function toFaroPerformanceTimingString(v3) {
  if (v3 == null) {
    return unknownString;
  }
  if (typeof v3 === "number") {
    return Math.round(v3 > 0 ? v3 : 0).toString();
  }
  return v3.toString();
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/performance/navigation.js
function getNavigationTimings(pushEvent) {
  let faroNavigationEntryResolve;
  const faroNavigationEntryPromise = new Promise((resolve) => {
    faroNavigationEntryResolve = resolve;
  });
  const observer = new PerformanceObserver((observedEntries) => {
    var _a;
    const [navigationEntryRaw] = observedEntries.getEntries();
    if (navigationEntryRaw == null || isUrlIgnored(navigationEntryRaw.name)) {
      return;
    }
    const navEntryJson = navigationEntryRaw.toJSON();
    let spanContext = getSpanContextFromServerTiming(navEntryJson === null || navEntryJson === void 0 ? void 0 : navEntryJson.serverTiming);
    const faroPreviousNavigationId = (_a = getItem(NAVIGATION_ID_STORAGE_KEY, webStorageType.session)) !== null && _a !== void 0 ? _a : unknownString;
    const faroNavigationEntry = Object.assign(Object.assign({}, createFaroNavigationTiming(navEntryJson)), { faroNavigationId: genShortID(), faroPreviousNavigationId });
    setItem(NAVIGATION_ID_STORAGE_KEY, faroNavigationEntry.faroNavigationId, webStorageType.session);
    pushEvent("faro.performance.navigation", faroNavigationEntry, void 0, {
      spanContext,
      timestampOverwriteMs: performance.timeOrigin + navEntryJson.startTime
    });
    faroNavigationEntryResolve(faroNavigationEntry);
  });
  observer.observe({
    type: NAVIGATION_ENTRY,
    buffered: true
  });
  return faroNavigationEntryPromise;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/performance/resource.js
var DEFAULT_TRACK_RESOURCES = { initiatorType: ["xmlhttprequest", "fetch"] };
function observeResourceTimings(faroNavigationId, pushEvent, observable) {
  const trackResources = faro.config.trackResources;
  const observer = new PerformanceObserver((observedEntries) => {
    const entries = observedEntries.getEntries();
    for (const resourceEntryRaw of entries) {
      if (isUrlIgnored(resourceEntryRaw.name)) {
        return;
      }
      const resourceEntryJson = resourceEntryRaw.toJSON();
      let spanContext = getSpanContextFromServerTiming(resourceEntryJson === null || resourceEntryJson === void 0 ? void 0 : resourceEntryJson.serverTiming);
      if (trackResources == null && includePerformanceEntry(resourceEntryJson, DEFAULT_TRACK_RESOURCES) || trackResources) {
        const faroResourceEntry = Object.assign(Object.assign({}, createFaroResourceTiming(resourceEntryJson)), { faroNavigationId, faroResourceId: genShortID() });
        if (faro.config.trackUserActionsPreview) {
          observable === null || observable === void 0 ? void 0 : observable.notify({
            type: RESOURCE_ENTRY
          });
        }
        pushEvent("faro.performance.resource", faroResourceEntry, void 0, {
          spanContext,
          timestampOverwriteMs: performance.timeOrigin + resourceEntryJson.startTime
        });
      }
    }
  });
  observer.observe({
    type: RESOURCE_ENTRY,
    buffered: true
  });
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/performance/instrumentation.js
var __awaiter = function(thisArg, _arguments, P3, generator) {
  function adopt(value) {
    return value instanceof P3 ? value : new P3(function(resolve) {
      resolve(value);
    });
  }
  return new (P3 || (P3 = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e4) {
        reject(e4);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e4) {
        reject(e4);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var performanceEntriesSubscription = new Observable();
var PerformanceInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super(...arguments);
    this.name = "@grafana/faro-web-sdk:instrumentation-performance";
    this.version = VERSION;
  }
  initialize() {
    if (!performanceObserverSupported()) {
      this.logDebug("performance observer not supported. Disable performance instrumentation.");
      return;
    }
    onDocumentReady(() => __awaiter(this, void 0, void 0, function* () {
      const pushEvent = this.api.pushEvent;
      const { faroNavigationId } = yield getNavigationTimings(pushEvent);
      if (faroNavigationId != null) {
        observeResourceTimings(faroNavigationId, pushEvent, performanceEntriesSubscription);
      }
    }));
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/const.js
var MESSAGE_TYPE_RESOURCE_ENTRY = "resource-entry";
var MESSAGE_TYPE_HTTP_REQUEST_START = "http-request-start";
var MESSAGE_TYPE_HTTP_REQUEST_END = "http-request-end";
var MESSAGE_TYPE_DOM_MUTATION = "dom-mutation";
var userActionDataAttributeParsed = "faroUserActionName";
var userActionDataAttribute = "data-faro-user-action-name";
var userActionStartByApiCallEventName = "faroApiCall";

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/domMutationMonitor.js
function monitorDomMutations() {
  const observable = new Observable();
  const observer = new MutationObserver((_mutationsList, _observer) => {
    observable.notify({ type: MESSAGE_TYPE_DOM_MUTATION });
  });
  observer.observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
    characterData: true
  });
  return observable;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/httpRequestMonitor.js
var apiTypeFetch = "fetch";
var apiTypeXhr = "xhr";
function monitorHttpRequests() {
  const observable = new Observable();
  function emitStartMessage(requestProps) {
    observable.notify({
      type: MESSAGE_TYPE_HTTP_REQUEST_START,
      request: requestProps
    });
  }
  function emitEndMessage(requestProps) {
    observable.notify({
      type: MESSAGE_TYPE_HTTP_REQUEST_END,
      request: requestProps
    });
  }
  monitorFetch({
    onRequestStart: emitStartMessage,
    onRequestEnd: emitEndMessage
  });
  monitorXhr({
    onRequestStart: emitStartMessage,
    onRequestEnd: emitEndMessage
  });
  return observable;
}
function monitorXhr({ onRequestStart, onRequestEnd }) {
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const url = arguments[1];
    const isIgnoredUrl = isUrlIgnored(url);
    const method = arguments[0];
    const requestId = genShortID();
    this.addEventListener("loadstart", function() {
      if (!isIgnoredUrl) {
        onRequestStart({ url, method, requestId, apiType: apiTypeXhr });
      }
    });
    this.addEventListener("load", function() {
      if (!isIgnoredUrl) {
        onRequestEnd({ url, method, requestId, apiType: apiTypeXhr });
      }
    });
    this.addEventListener("error", function() {
      if (!isIgnoredUrl) {
        onRequestEnd({ url, method, requestId, apiType: apiTypeXhr });
      }
    });
    this.addEventListener("abort", function() {
      if (!isIgnoredUrl) {
        onRequestEnd({ url, method, requestId, apiType: apiTypeXhr });
      }
    });
    originalOpen.apply(this, arguments);
  };
}
function monitorFetch({ onRequestEnd, onRequestStart }) {
  const originalFetch = window.fetch;
  window.fetch = function() {
    var _a, _b;
    const url = (_a = getUrlFromResource(arguments[0])) !== null && _a !== void 0 ? _a : "";
    const isIgnoredUrl = isUrlIgnored(url);
    const method = ((_b = arguments[1]) !== null && _b !== void 0 ? _b : {}).method;
    const requestId = genShortID();
    if (!isIgnoredUrl) {
      onRequestStart({ url, method, requestId, apiType: apiTypeFetch });
    }
    return originalFetch.apply(this, arguments).then((response) => {
      if (!isIgnoredUrl) {
        onRequestEnd({ url, method, requestId, apiType: apiTypeFetch });
      }
      return response;
    }).catch((error) => {
      if (!isIgnoredUrl) {
        onRequestEnd({ url, method, requestId, apiType: apiTypeFetch });
      }
      throw error;
    });
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/performanceEntriesMonitor.js
function monitorPerformanceEntries() {
  const observable = new Observable();
  performanceEntriesSubscription.subscribe((data) => {
    if (data.type === RESOURCE_ENTRY) {
      observable.notify({ type: MESSAGE_TYPE_RESOURCE_ENTRY });
    }
  });
  return observable;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/util.js
function convertDataAttributeName(userActionDataAttribute2) {
  const withoutData = userActionDataAttribute2.split("data-")[1];
  const withUpperCase = withoutData === null || withoutData === void 0 ? void 0 : withoutData.replace(/-(.)/g, (_3, char) => char.toUpperCase());
  return withUpperCase === null || withUpperCase === void 0 ? void 0 : withUpperCase.replace(/-/g, "");
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/processUserActionEventHandler.js
var maxFollowUpActionTimeRange = 100;
function getUserEventHandler(faro2) {
  const { api, config } = faro2;
  const httpMonitor = monitorHttpRequests();
  const domMutationsMonitor = monitorDomMutations();
  const performanceEntriesMonitor = monitorPerformanceEntries();
  let timeoutId;
  let actionRunning = false;
  function processUserEvent(event) {
    var _a;
    let userActionName;
    const isApiEventDetected = isApiEvent(event);
    if (isApiEventDetected) {
      userActionName = event.name;
    } else {
      userActionName = getUserActionName(event.target, (_a = config.trackUserActionsDataAttributeName) !== null && _a !== void 0 ? _a : userActionDataAttributeParsed);
    }
    if (actionRunning || userActionName == null) {
      return;
    }
    actionRunning = true;
    const startTime = dateNow();
    let endTime;
    const actionId = genShortID();
    apiMessageBus.notify({
      type: USER_ACTION_START,
      name: userActionName,
      startTime,
      parentId: actionId
    });
    timeoutId = startTimeout(timeoutId, () => {
      endTime = dateNow();
      actionRunning = false;
      sendUserActionCancelMessage(userActionName, actionId);
    }, maxFollowUpActionTimeRange);
    const runningRequests = /* @__PURE__ */ new Map();
    let isHalted = false;
    let pendingActionTimeoutId;
    const allMonitorsSub = new Observable().merge(httpMonitor, domMutationsMonitor, performanceEntriesMonitor).takeWhile(() => actionRunning).filter((msg) => {
      if (isHalted && !(isRequestEndMessage(msg) && runningRequests.has(msg.request.requestId))) {
        return false;
      }
      return true;
    }).subscribe((msg) => {
      if (isRequestStartMessage(msg)) {
        runningRequests.set(msg.request.requestId, msg.request);
      }
      if (isRequestEndMessage(msg)) {
        runningRequests.delete(msg.request.requestId);
      }
      timeoutId = startTimeout(timeoutId, () => {
        endTime = dateNow();
        const userActionParentEventProps = Object.assign({
          api,
          userActionName,
          startTime,
          endTime,
          actionId,
          event
        }, isApiEventDetected ? { attributes: event.attributes } : {});
        const hasPendingRequests = runningRequests.size > 0;
        const isAllPendingRequestsResolved = isHalted && !hasPendingRequests;
        if (isAllPendingRequestsResolved) {
          clearTimeout(pendingActionTimeoutId);
          isHalted = false;
        }
        if (hasPendingRequests) {
          isHalted = true;
          apiMessageBus.notify({
            type: USER_ACTION_HALT,
            name: userActionName,
            parentId: actionId,
            reason: "pending-requests",
            haltTime: dateNow()
          });
          pendingActionTimeoutId = startTimeout(void 0, () => {
            unsubscribeAllMonitors(allMonitorsSub);
            endUserAction(userActionParentEventProps);
            actionRunning = false;
            isHalted = false;
          }, 1e3 * 10);
        } else {
          unsubscribeAllMonitors(allMonitorsSub);
          endUserAction(userActionParentEventProps);
          actionRunning = false;
          isHalted = false;
        }
      }, maxFollowUpActionTimeRange);
    });
  }
  return processUserEvent;
}
function endUserAction(props) {
  const { api, userActionName, startTime, endTime, actionId, event, attributes } = props;
  const duration = endTime - startTime;
  const eventType = event.type;
  apiMessageBus.notify({
    type: USER_ACTION_END,
    name: userActionName,
    id: actionId,
    startTime,
    endTime,
    duration,
    eventType
  });
  api.pushEvent(userActionName, Object.assign({ userActionStartTime: startTime.toString(), userActionEndTime: endTime.toString(), userActionDuration: duration.toString(), userActionTrigger: eventType }, stringifyObjectValues(attributes)), void 0, {
    timestampOverwriteMs: startTime,
    customPayloadTransformer: (payload) => {
      payload.action = {
        id: actionId,
        name: userActionName
      };
      return payload;
    }
  });
}
function getUserActionName(element, dataAttributeName) {
  const parsedDataAttributeName = convertDataAttributeName(dataAttributeName);
  const dataset = element.dataset;
  for (const key in dataset) {
    if (key === parsedDataAttributeName) {
      return dataset[key];
    }
  }
  return void 0;
}
function startTimeout(timeoutId, cb, delay) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  timeoutId = setTimeout(() => {
    cb();
  }, delay);
  return timeoutId;
}
function sendUserActionCancelMessage(userActionName, actionId) {
  apiMessageBus.notify({
    type: USER_ACTION_CANCEL,
    name: userActionName,
    parentId: actionId
  });
}
function unsubscribeAllMonitors(allMonitorsSub) {
  allMonitorsSub === null || allMonitorsSub === void 0 ? void 0 : allMonitorsSub.unsubscribe();
  allMonitorsSub = void 0;
}
function isRequestStartMessage(msg) {
  return msg.type === MESSAGE_TYPE_HTTP_REQUEST_START;
}
function isRequestEndMessage(msg) {
  return msg.type === MESSAGE_TYPE_HTTP_REQUEST_END;
}
function isApiEvent(apiEvent) {
  return apiEvent.type === userActionStartByApiCallEventName && typeof apiEvent.name === "string";
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/userActions/instrumentation.js
var processUserEventHandler;
var UserActionInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super(...arguments);
    this.name = "@grafana/faro-web-sdk:instrumentation-user-action";
    this.version = VERSION;
  }
  initialize() {
    processUserEventHandler = getUserEventHandler(faro);
    window.addEventListener("pointerdown", processUserEventHandler);
    window.addEventListener("keydown", processUserEventHandler);
  }
};
function startUserAction(name, attributes) {
  processUserEventHandler === null || processUserEventHandler === void 0 ? void 0 : processUserEventHandler(createUserActionApiEvent(name, attributes));
}
function createUserActionApiEvent(name, attributes) {
  return {
    name,
    attributes,
    type: userActionStartByApiCallEventName
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/instrumentations/csp/instrumentation.js
var CSPInstrumentation = class extends BaseInstrumentation {
  constructor() {
    super();
    this.name = "@grafana/faro-web-sdk:instrumentation-csp";
    this.version = VERSION;
  }
  initialize() {
    document.addEventListener("securitypolicyviolation", this.securitypolicyviolationHandler.bind(this));
  }
  destroy() {
    document.removeEventListener("securitypolicyviolation", this.securitypolicyviolationHandler);
  }
  securitypolicyviolationHandler(ev) {
    this.api.pushEvent("securitypolicyviolation", stringifyObjectValues(ev));
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/config/getWebInstrumentations.js
function getWebInstrumentations(options = {}) {
  const instrumentations = [
    new UserActionInstrumentation(),
    new ErrorsInstrumentation(),
    new WebVitalsInstrumentation(),
    new SessionInstrumentation(),
    new ViewInstrumentation()
  ];
  if (options.enablePerformanceInstrumentation !== false) {
    instrumentations.unshift(new PerformanceInstrumentation());
  }
  if (options.enableContentSecurityPolicyInstrumentation !== false) {
    instrumentations.push(new CSPInstrumentation());
  }
  if (options.captureConsole !== false) {
    instrumentations.push(new ConsoleInstrumentation({
      disabledLevels: options.captureConsoleDisabledLevels
    }));
  }
  return instrumentations;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/consts.js
var defaultEventDomain = "browser";

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/metas/k6/meta.js
var k6Meta = () => {
  const k6Properties = window.k6;
  return {
    k6: Object.assign({
      // we only add the k6 meta if Faro is running inside a k6 environment, so this is always true
      isK6Browser: true
    }, (k6Properties === null || k6Properties === void 0 ? void 0 : k6Properties.testRunId) && { testRunId: k6Properties === null || k6Properties === void 0 ? void 0 : k6Properties.testRunId })
  };
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/metas/page/meta.js
var currentHref;
var pageId;
function createPageMeta({ generatePageId, initialPageMeta } = {}) {
  const pageMeta = () => {
    const locationHref = location.href;
    if (isFunction(generatePageId) && currentHref !== locationHref) {
      currentHref = locationHref;
      pageId = generatePageId(location);
    }
    return {
      page: Object.assign(Object.assign({ url: locationHref }, pageId ? { id: pageId } : {}), initialPageMeta)
    };
  };
  return pageMeta;
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/transports/console/transport.js
var ConsoleTransport = class extends BaseTransport {
  constructor(options = {}) {
    super();
    this.options = options;
    this.name = "@grafana/faro-web-sdk:transport-console";
    this.version = VERSION;
  }
  send(item) {
    var _a;
    return this.unpatchedConsole[(_a = this.options.level) !== null && _a !== void 0 ? _a : LogLevel.DEBUG]("New event", getTransportBody([item]));
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/transports/fetch/transport.js
var __awaiter2 = function(thisArg, _arguments, P3, generator) {
  function adopt(value) {
    return value instanceof P3 ? value : new P3(function(resolve) {
      resolve(value);
    });
  }
  return new (P3 || (P3 = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e4) {
        reject(e4);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e4) {
        reject(e4);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __rest = function(s3, e4) {
  var t4 = {};
  for (var p3 in s3) if (Object.prototype.hasOwnProperty.call(s3, p3) && e4.indexOf(p3) < 0)
    t4[p3] = s3[p3];
  if (s3 != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i3 = 0, p3 = Object.getOwnPropertySymbols(s3); i3 < p3.length; i3++) {
      if (e4.indexOf(p3[i3]) < 0 && Object.prototype.propertyIsEnumerable.call(s3, p3[i3]))
        t4[p3[i3]] = s3[p3[i3]];
    }
  return t4;
};
var DEFAULT_BUFFER_SIZE = 30;
var DEFAULT_CONCURRENCY = 5;
var DEFAULT_RATE_LIMIT_BACKOFF_MS = 5e3;
var BEACON_BODY_SIZE_LIMIT = 6e4;
var TOO_MANY_REQUESTS = 429;
var ACCEPTED = 202;
var FetchTransport = class extends BaseTransport {
  constructor(options) {
    var _a, _b, _c, _d;
    super();
    this.options = options;
    this.name = "@grafana/faro-web-sdk:transport-fetch";
    this.version = VERSION;
    this.disabledUntil = /* @__PURE__ */ new Date();
    this.rateLimitBackoffMs = (_a = options.defaultRateLimitBackoffMs) !== null && _a !== void 0 ? _a : DEFAULT_RATE_LIMIT_BACKOFF_MS;
    this.getNow = (_b = options.getNow) !== null && _b !== void 0 ? _b : (() => Date.now());
    this.promiseBuffer = createPromiseBuffer({
      size: (_c = options.bufferSize) !== null && _c !== void 0 ? _c : DEFAULT_BUFFER_SIZE,
      concurrency: (_d = options.concurrency) !== null && _d !== void 0 ? _d : DEFAULT_CONCURRENCY
    });
  }
  send(items) {
    return __awaiter2(this, void 0, void 0, function* () {
      try {
        if (this.disabledUntil > new Date(this.getNow())) {
          this.logWarn(`Dropping transport item due to too many requests. Backoff until ${this.disabledUntil}`);
          return Promise.resolve();
        }
        yield this.promiseBuffer.add(() => {
          const body = JSON.stringify(getTransportBody(items));
          const { url, requestOptions, apiKey } = this.options;
          const _a = requestOptions !== null && requestOptions !== void 0 ? requestOptions : {}, { headers } = _a, restOfRequestOptions = __rest(_a, ["headers"]);
          let sessionId;
          const sessionMeta = this.metas.value.session;
          if (sessionMeta != null) {
            sessionId = sessionMeta.id;
          }
          return fetch(url, Object.assign({ method: "POST", headers: Object.assign(Object.assign(Object.assign({ "Content-Type": "application/json" }, headers !== null && headers !== void 0 ? headers : {}), apiKey ? { "x-api-key": apiKey } : {}), sessionId ? { "x-faro-session-id": sessionId } : {}), body, keepalive: body.length <= BEACON_BODY_SIZE_LIMIT }, restOfRequestOptions !== null && restOfRequestOptions !== void 0 ? restOfRequestOptions : {})).then((response) => __awaiter2(this, void 0, void 0, function* () {
            if (response.status === ACCEPTED) {
              const sessionExpired = response.headers.get("X-Faro-Session-Status") === "invalid";
              if (sessionExpired) {
                this.extendFaroSession(this.config, this.logDebug);
              }
            }
            if (response.status === TOO_MANY_REQUESTS) {
              this.disabledUntil = this.getRetryAfterDate(response);
              this.logWarn(`Too many requests, backing off until ${this.disabledUntil}`);
            }
            response.text().catch(noop);
            return response;
          })).catch((err) => {
            this.logError("Failed sending payload to the receiver\n", JSON.parse(body), err);
          });
        });
      } catch (err) {
        this.logError(err);
      }
    });
  }
  getIgnoreUrls() {
    var _a;
    return [this.options.url].concat((_a = this.config.ignoreUrls) !== null && _a !== void 0 ? _a : []);
  }
  isBatched() {
    return true;
  }
  getRetryAfterDate(response) {
    const now = this.getNow();
    const retryAfterHeader = response.headers.get("Retry-After");
    if (retryAfterHeader) {
      const delay = Number(retryAfterHeader);
      if (!isNaN(delay)) {
        return new Date(delay * 1e3 + now);
      }
      const date = Date.parse(retryAfterHeader);
      if (!isNaN(date)) {
        return new Date(date);
      }
    }
    return new Date(now + this.rateLimitBackoffMs);
  }
  extendFaroSession(config, logDebug) {
    const SessionExpiredString = `Session expired`;
    const sessionTrackingConfig = config.sessionTracking;
    if (sessionTrackingConfig === null || sessionTrackingConfig === void 0 ? void 0 : sessionTrackingConfig.enabled) {
      const { fetchUserSession, storeUserSession } = getSessionManagerByConfig(sessionTrackingConfig);
      getUserSessionUpdater({ fetchUserSession, storeUserSession })({ forceSessionExtend: true });
      logDebug(`${SessionExpiredString} created new session.`);
    } else {
      logDebug(`${SessionExpiredString}.`);
    }
  }
};

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/config/makeCoreConfig.js
var __rest2 = function(s3, e4) {
  var t4 = {};
  for (var p3 in s3) if (Object.prototype.hasOwnProperty.call(s3, p3) && e4.indexOf(p3) < 0)
    t4[p3] = s3[p3];
  if (s3 != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i3 = 0, p3 = Object.getOwnPropertySymbols(s3); i3 < p3.length; i3++) {
      if (e4.indexOf(p3[i3]) < 0 && Object.prototype.propertyIsEnumerable.call(s3, p3[i3]))
        t4[p3[i3]] = s3[p3[i3]];
    }
  return t4;
};
function makeCoreConfig(browserConfig) {
  var _a;
  const transports = [];
  const internalLogger2 = createInternalLogger(browserConfig.unpatchedConsole, browserConfig.internalLoggerLevel);
  if (browserConfig.transports) {
    if (browserConfig.url || browserConfig.apiKey) {
      internalLogger2.error('if "transports" is defined, "url" and "apiKey" should not be defined');
    }
    transports.push(...browserConfig.transports);
  } else if (browserConfig.url) {
    transports.push(new FetchTransport({
      url: browserConfig.url,
      apiKey: browserConfig.apiKey
    }));
  } else {
    internalLogger2.error('either "url" or "transports" must be defined');
  }
  const {
    // properties with default values
    dedupe = true,
    eventDomain = defaultEventDomain,
    globalObjectKey = defaultGlobalObjectKey,
    instrumentations = getWebInstrumentations(),
    internalLoggerLevel = defaultInternalLoggerLevel,
    isolate = false,
    logArgsSerializer = defaultLogArgsSerializer,
    metas = createDefaultMetas(browserConfig),
    paused = false,
    preventGlobalExposure = false,
    unpatchedConsole: unpatchedConsole2 = defaultUnpatchedConsole,
    trackUserActionsPreview = false,
    trackUserActionsDataAttributeName = userActionDataAttribute,
    url: browserConfigUrl
  } = browserConfig, restProperties = __rest2(browserConfig, ["dedupe", "eventDomain", "globalObjectKey", "instrumentations", "internalLoggerLevel", "isolate", "logArgsSerializer", "metas", "paused", "preventGlobalExposure", "unpatchedConsole", "trackUserActionsPreview", "trackUserActionsDataAttributeName", "url"]);
  return Object.assign(Object.assign({}, restProperties), {
    batching: Object.assign(Object.assign({}, defaultBatchingConfig), browserConfig.batching),
    dedupe,
    globalObjectKey,
    instrumentations: getFilteredInstrumentations(instrumentations, browserConfig),
    internalLoggerLevel,
    isolate,
    logArgsSerializer,
    metas,
    parseStacktrace,
    paused,
    preventGlobalExposure,
    transports,
    unpatchedConsole: unpatchedConsole2,
    eventDomain,
    ignoreUrls: [
      ...(_a = browserConfig.ignoreUrls) !== null && _a !== void 0 ? _a : [],
      // ignore configured cloud collector url by default
      ...browserConfigUrl ? [browserConfigUrl] : [],
      // Try our best to exclude collector URLs form other Faro instances. By default these are URLs ending with /collect or /collect/ followed by alphanumeric characters.
      /\/collect(?:\/[\w]*)?$/
    ],
    sessionTracking: Object.assign(Object.assign(Object.assign({}, defaultSessionTrackingConfig), browserConfig.sessionTracking), crateSessionMeta({
      trackGeolocation: browserConfig.trackGeolocation,
      sessionTracking: browserConfig.sessionTracking
    })),
    trackUserActionsPreview,
    trackUserActionsDataAttributeName
  });
}
function getFilteredInstrumentations(instrumentations, { trackUserActionsPreview }) {
  return instrumentations.filter((instr) => {
    if (instr.name === "@grafana/faro-web-sdk:instrumentation-user-action" && !trackUserActionsPreview) {
      return false;
    }
    return true;
  });
}
function createDefaultMetas(browserConfig) {
  var _a, _b;
  const { page, generatePageId } = (_a = browserConfig === null || browserConfig === void 0 ? void 0 : browserConfig.pageTracking) !== null && _a !== void 0 ? _a : {};
  const initialMetas = [
    browserMeta,
    createPageMeta({ generatePageId, initialPageMeta: page }),
    ...(_b = browserConfig.metas) !== null && _b !== void 0 ? _b : []
  ];
  const isK6BrowserSession = isObject(window.k6);
  if (isK6BrowserSession) {
    return [...initialMetas, k6Meta];
  }
  return initialMetas;
}
function crateSessionMeta({ trackGeolocation, sessionTracking }) {
  var _a;
  const overrides = {};
  if (isBoolean(trackGeolocation)) {
    overrides.geoLocationTrackingEnabled = trackGeolocation;
  }
  if (isEmpty(overrides)) {
    return {};
  }
  return {
    session: Object.assign(Object.assign({}, (_a = sessionTracking === null || sessionTracking === void 0 ? void 0 : sessionTracking.session) !== null && _a !== void 0 ? _a : {}), { overrides })
  };
}

// node_modules/.pnpm/@grafana+faro-web-sdk@1.19.0/node_modules/@grafana/faro-web-sdk/dist/esm/initialize.js
function initializeFaro2(config) {
  const coreConfig = makeCoreConfig(config);
  if (!coreConfig) {
    return void 0;
  }
  return initializeFaro(coreConfig);
}
export {
  BaseExtension,
  BaseInstrumentation,
  BaseTransport,
  CSPInstrumentation,
  ConsoleInstrumentation,
  ConsoleTransport,
  Conventions,
  EVENT_CLICK,
  EVENT_NAVIGATION,
  EVENT_ROUTE_CHANGE,
  EVENT_SESSION_EXTEND,
  EVENT_SESSION_RESUME,
  EVENT_SESSION_START,
  EVENT_VIEW_CHANGED,
  ErrorsInstrumentation,
  FetchTransport,
  InternalLoggerLevel,
  LogLevel,
  MAX_SESSION_PERSISTENCE_TIME,
  MAX_SESSION_PERSISTENCE_TIME_BUFFER,
  Observable,
  PerformanceInstrumentation,
  PersistentSessionsManager,
  SESSION_EXPIRATION_TIME,
  SESSION_INACTIVITY_TIME,
  STORAGE_KEY,
  SessionInstrumentation,
  TransportItemType,
  USER_ACTION_CANCEL,
  USER_ACTION_END,
  USER_ACTION_HALT,
  USER_ACTION_START,
  UserActionInstrumentation,
  VERSION,
  ViewInstrumentation,
  VolatileSessionsManager,
  WebVitalsInstrumentation,
  allLogLevels,
  apiMessageBus,
  browserMeta,
  buildStackFrame,
  createInternalLogger,
  createPromiseBuffer,
  createSession,
  deepEqual,
  defaultEventDomain,
  defaultExceptionType,
  defaultGlobalObjectKey,
  defaultInternalLoggerLevel,
  defaultLogLevel,
  faro,
  genShortID,
  getCurrentTimestamp,
  getDataFromSafariExtensions,
  getIgnoreUrls,
  getInternalFromGlobalObject as getInternalFaroFromGlobalObject,
  getStackFramesFromError,
  getTransportBody,
  getUrlFromResource,
  getWebInstrumentations,
  globalObject,
  initializeFaro2 as initializeFaro,
  internalGlobalObjectKey,
  isArray,
  isBoolean,
  isDomError,
  isDomException,
  isElement,
  isElementDefined,
  isEmpty,
  isError,
  isErrorDefined,
  isErrorEvent,
  isEvent,
  isEventDefined,
  isFunction,
  isInstanceOf,
  isInt,
  isInternalFaroOnGlobalObject,
  isMap,
  isMapDefined,
  isNull,
  isNumber,
  isObject,
  isPrimitive,
  isRegExp,
  isString,
  isSymbol,
  isSyntheticEvent,
  isThenable,
  isToString,
  isTypeof,
  isUndefined,
  makeCoreConfig,
  noop,
  parseStacktrace,
  sdkMeta,
  setInternalFaroOnGlobalObject,
  startUserAction,
  transportItemTypeToBodyKey,
  unknownString,
  userActionDataAttribute
};
//# sourceMappingURL=@grafana_faro-web-sdk.js.map
