// ==UserScript==
// @icon         http://tns.thss.tsinghua.edu.cn/~yangzheng/images/Tsinghua_University_Logo_Big.png
// @name         网络学堂1202助手
// @namespace    exhen32@live.com
// @version      2021年10月28日00版
// @description  直观展现死线情况，点击即可跳转；导出所有课程至日历；一键标记公告已读。
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant        GM.xmlHttpRequest
// @connect      zhjw.cic.tsinghua.edu.cn
// @author       thuyesh
// @match        http*://learn.tsinghua.edu.cn/f/wlxt/index/course/student/
// @match        http*://learn.tsinghua.edu.cn/f/wlxt/*
// @connect      learn.tsinghua.edu.cn
// @updateURL    https://greasyfork.org/scripts/422447-%E7%BD%91%E7%BB%9C%E5%AD%A6%E5%A0%822018%E5%8A%A9%E6%89%8B/code/%E7%BD%91%E7%BB%9C%E5%AD%A6%E5%A0%822018%E5%8A%A9%E6%89%8B.user.js
// @run-at       document-end
// @updateURL    https://greasyfork.org/scripts/422447/code/user.js
// ==/UserScript==

document.head.appendChild(document.createElement('style'))
const sheet = document.styleSheets[document.styleSheets.length - 1];

[
`
#banner .left a img {
    cursor: pointer;
    margin-top: 6px;
    margin-bottom: 6px;
    padding-top: 5px;
    padding-bottom: 5px;
    background: linear-gradient(90deg, rgb(67, 159, 226) 0%, rgb(75, 168, 234) 55.29%, rgb(0, 114, 198) 55.29%);
    border-radius: 10px;
}
`,`.unsee {
    display: none;
}`,`
body.loading * {
    cursor: progress !important;
}
`,`
.boxdetail .state li.clearfix span.stud.number {
    display: block;
    font-size: 3em;
    padding-left: 0;
    text-align: center;
}
`,`
.boxdetail .state li.clearfix a.number+p {
    display: none;
}
`,`
.p_img {
    display: none;
}
`,`
ul.stu.clearfix li.clearfix:first-child {
    text-align: center;
    display: flex;
    flex-flow: column;
    justify-content: center;
}
`,`
ul.stu.clearfix li.clearfix:first-child a {
    text-decoration: underline;
    font-size: 1.5em;
    color: black;
}
`,`
ul.stu.clearfix.clean li.clearfix:first-child {
    background-color: lightgreen;
    color: white;
    font-size: 2em;
    font-weight: bolder;
}
`,`
ul.stu.clearfix.hw-yellow li.clearfix:first-child {
    background-color: gold;
}
`,`
ul.stu.clearfix.hw-orange li.clearfix:first-child {
    background-color: orange;
}
`,`
ul.stu.clearfix.hw-red li.clearfix:first-child {
    background-color: red;
}
`,`
ul.stu.clearfix.hw-red li.clearfix:first-child a {
    color: yellow;
}
`,`
ul.stu.clearfix.hw-overdue li.clearfix:first-child {
    background-color: lightgrey;
}
`,`
ul.stu.clearfix.clean li.clearfix:first-child::after {
    content: "✓";
}
`,`
.state.stu.clearfix .operations {
    margin-top: 0.5em;
}
`,`
button.operation {
    background-color: white;
    padding: 0.3em;
    border: 1px grey solid;
    cursor: pointer;
    border-radius: 3px;
    transition: background-color 0.1s;
}
`,`
button.operation:not(:first-child) {
    margin-left: 1em;
}
`,`
button.operation:hover, button.operation:active {
    background-color: lightgrey;
}
`,`
.boxdetail .state .num {
    margin-right: 1em;
}
`,`
.header#banner .w, body .content, .footer#banner_footer .w {
    width: unset;
}
`].forEach((rule) => sheet.insertRule(rule, 0))

function setLoading() {
    document.body.classList.add('loading')
}

function unsetLoading() {
    document.body.classList.remove('loading')
}

var csrf = ''
const dummy = {
    'sEcho': 1,
    'iColumns': 8,
    'sColumns': ',,,,,,,',
    'iDisplayStart': 0,
    'iDisplayLength': '30',
    'mDataProp_0': 'wz',
    'bSortable_0': false,
    'mDataProp_1': 'bt',
    'bSortable_1': true,
    'mDataProp_2': 'mxdxmc',
    'bSortable_2': true,
    'mDataProp_3': 'zywcfs',
    'bSortable_3': true,
    'mDataProp_4': 'kssj',
    'bSortable_4': true,
    'mDataProp_5': 'jzsj',
    'bSortable_5': true,
    'mDataProp_6': 'jzsj',
    'bSortable_6': true,
    'mDataProp_7': 'function',
    'bSortable_7': false,
    'iSortCol_0': 5,
    'sSortDir_0': 'desc',
    'iSortCol_1': 6,
    'sSortDir_1': 'desc',
    'iSortingCols': 2,
    'wlkcid': ''
}
function shallowCopyObject(obj) {
    return Object.fromEntries(Object.entries(obj))
}
function fetchResponse(url, method, data) {
    return fetch(url.includes('?') ? (url + '&_csrf=' + csrf) : (url + '?_csrf=' + csrf), {
        method: method,
        headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Cache-Control': 'max-age=0',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        referrer: 'https://learn.tsinghua.edu.cn/',
        referrerPolicy: 'strict-origin-when-cross-origin',
        body: method.toUpperCase() === 'POST' ? new URLSearchParams({
            'aoData': JSON.stringify(Object.entries(Object.assign(shallowCopyObject(dummy), data)).map(function (e) {
                return {
                    'name': e[0],
                    'value': e[1]
                }
            }))
        }) : undefined,
    })
}
function fetchJSON(url, method, data) {
    return fetchResponse(url, method, data).then(function (response) {
        if (response.ok) {
            return response.json()
        } else {
            return Promise.resolve()
        }
    })
}
function getJSON(url) {
    return fetchJSON(url, 'GET')
}

function displayDDL(e, wlkcid) {
    var parent = e.parentElement.parentElement.parentElement
    if (parseInt(e.innerText) > 0) {
        fetchJSON('http://learn.tsinghua.edu.cn/b/wlxt/kczy/zy/student/zyListWj', 'POST', { 'wlkcid': wlkcid }).then(
            function (json) {
                if(json) {
                    var now = Date.now()
                    var deadlines = json.object.aaData.filter((hw) => hw.jzsj - now > 0)
                    var hwLink = document.createElement('a')
                    if(deadlines.length === 0) {
                        hwLink.innerText = '已过期'
                        parent.classList.add('hw-overdue')
                    } else {
                        var deadline = deadlines.reduce((hw1, hw2) => (hw1.jzsj > hw2.jzsj ? hw2 : hw1))
                        var days = Math.floor((deadline.jzsj - now) / 1000 / 60 / 60 / 24)
                        hwLink.innerText = `剩余 ${days} 天`
                        hwLink.href = `https://learn.tsinghua.edu.cn/f/wlxt/kczy/zy/student/viewZy?wlkcid=${deadline.wlkcid}&sfgq=0&zyid=${deadline.zyid}&xszyid=${deadline.xszyid}`
                        const bgColors = ['hw-red', 'hw-red', 'hw-orange', 'hw-orange', 'hw-orange', 'hw-orange', 'hw-orange']
                        parent.classList.add(bgColors[days] ? bgColors[days] : 'hw-yellow')
                    }
                    parent.querySelector('li.clearfix:first-child').appendChild(hwLink)
                }
            }
        )
    } else {
        parent.classList.add('clean')
    }
}

function saveNewFiles(e, wlkcid) {
    getJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kj/wlkc_kjxxb/student/kjxxbByWlkcidAndSizeForStudent?size=999&wlkcid=${wlkcid}`).then((json) => {
        if(json) {
            var files = json.object.filter(f => f.isNew )
            if(files.length === 0) {
                alert('无新课件')
            } else {
                var size = files.reduce((i, file) => i + file.wjdx, 0)
                const sizeSuffix = ['kB', 'MB', 'GB', 'TB']
                var humanReadable = sizeSuffix.reduce((size, name) => {
                    if(size[0] >= 1024) {
                        return [size[0] / 1024, name]
                    } else {
                        return size
                    }
                }, [size, 'B'])
                if(confirm(`下载以下 ${humanReadable[0].toFixed(2)} ${humanReadable[1]} 的新课件？\n→ ${files.map(f => `${f.bt} - ${f.fileSize}`).join('\n→ ')}`)) {
                    files.forEach(f => window.open(`http://learn.tsinghua.edu.cn/b/wlxt/kj/wlkc_kjxxb/student/downloadFile?sfgk=0&wjid=${f.wjid}`))
                }
            }
        }
    })
}

function markRead(e, wlkcid) {
    setLoading()
    getJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kcgg/wlkc_ggb/student/kcggListXs?size=999&wlkcid=${wlkcid}`).then(json => {
        if(json) {
            var unreadItems = json.object.aaData.filter(e => e.sfyd === '否')
            if (unreadItems.length === 0) {
                alert('无公告')
            } else if (confirm(`按确认键将以下公告设为已读：\n${unreadItems.map(function(e) { return '→ ' + e.bt }).join('\n')}`)) {
                let total = unreadItems.length
                let count = 0
                var handleResponse = response => {
                    count++
                    if (total === count) {
                        alert('已读完成')
                        location.reload()
                    }
                }
                unreadItems.forEach(e =>
                                    fetchResponse(`http://learn.tsinghua.edu.cn/f/wlxt/kcgg/wlkc_ggb/student/beforeViewXs?wlkcid=${wlkcid}&id=${e.ggid}`, 'GET')
                                            .then(handleResponse)
                )
            }
        } else {
            alert('网络错误')
            unsetLoading()
        }
    })
}

function displayOperations(e, wlkcid) {
    const operations = {
        '所有公告标为已读': markRead,
        '批量保存新课件': saveNewFiles,
    }
    var buttonContainer = document.createElement('div')
    buttonContainer.classList.add('operations')
    for(var i in operations) {
        var button = document.createElement('button')
        button.innerText = i
        button.classList.add('operation')
        button.onclick = (operation => (() => operation(e, wlkcid)))(operations[i])
        buttonContainer.appendChild(button)
    }
    e.parentElement.parentElement.parentElement.parentElement.appendChild(buttonContainer)
}

function fetchEvents(year, month, events) {
    var thisMonth = new Date()
    thisMonth.setFullYear(year, month, 1)
    var nextMonth = new Date()
    nextMonth.setFullYear(year, month + 1, 1)
    return new Promise((resolve, reject) => {
        GM.xmlHttpRequest({
            method: "GET",
            url: `https://zhjw.cic.tsinghua.edu.cn/jxmh_out.do?m=bks_jxrl_all&p_start_date=${thisMonth.toISOString().slice(0, 7).replaceAll('-', '')}01`
                    + `&p_end_date=${nextMonth.toISOString().slice(0, 7).replaceAll('-', '')}01&jsoncallback=no_such_method`,
            onload: response => {
                if(response.status < 400) {
                    var text = response.responseText
                    var monthCalendar = JSON.parse(text.slice(15, -1))
                    if(monthCalendar.length === 0) {
                        resolve(events)
                    } else {
                        resolve(fetchEvents(year, month + 1, events.concat(
                            monthCalendar.filter(event => (new Date(event.nq)).getMonth() === thisMonth.getMonth())
                        )))
                    }
                }
            },
            onerror: reject,
        })
    })
}

function getTZ(date, time) {
    return `${date.replaceAll('-', '')}T${time.replaceAll(':', '')}00`
}

function makeIEvent(event, prior) {
    return `BEGIN:VEVENT\r
UID:${getTZ(event.nq, event.kssj)}-${Math.floor(Math.random() * 10000)}@tsinghua.edu.cn\r
DTSTAMP;TZID=Asia/Shanghai:${getTZ(event.nq, event.kssj)}\r
DTSTART;TZID=Asia/Shanghai:${getTZ(event.nq, event.kssj)}\r
DTEND;TZID=Asia/Shanghai:${getTZ(event.nq, event.jssj)}\r
SUMMARY:${event.nr}\r
LOCATION:${event.dd}\r
BEGIN:VALARM\r
TRIGGER:-PT${prior}M\r
ACTION:DISPLAY\r
DESCRIPTION:${event.nr}前 ${prior} 分钟提醒\r
END:VALARM\r
END:VEVENT`
}

function makeICalendar(events, prior) {
    return `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//Web THU Helper//iCalender//EN\r
BEGIN:VTIMEZONE\r
TZID:Asia/Shanghai\r
BEGIN:STANDARD\r
TZOFFSETFROM:+0800\r
TZOFFSETTO:+0800\r
TZNAME:CST\r
DTSTART:19700101T000000\r
END:STANDARD\r
END:VTIMEZONE\r
${events.map(makeIEvent, prior).join('\r\n')}\r
END:VCALENDAR\r
`
}

function calendarizeAll() {
    setLoading()
    getJSON('https://learn.tsinghua.edu.cn/b/kc/zhjw_v_code_xnxq/getCurrentAndNextSemester').then(json => {
        if(json) {
            var now = new Date(json.result.kssj)
            var month = now.getMonth()
            var year = now.getFullYear()
            var alarmPrior = parseInt(prompt('日历文件可设置日程提醒，每节课提前多少分钟提醒？', 30))
            if(alarmPrior > 0) {
                fetchEvents(year, month, []).then(events => {
                    unsetLoading()
                    var blob = new Blob([makeICalendar(events, alarmPrior)], {type: "text/plain"})
                    // eslint-disable-next-line no-undef
                    saveAs(blob, `${json.result.xnxqmc}.ics`)
                })
            } else {
                unsetLoading()
            }
        } else {
            unsetLoading()
        }
    })
}

function customize() {
    csrf = new URL(document.querySelector('.p_img>img').src).searchParams.get('_csrf');

    document.querySelectorAll('span.stud').forEach(function (e) {
        if (parseInt(e.innerText) > 0) {
            e.classList.add('number')
            e.parentElement.classList.add('number')
        }

        if (e.classList.contains('green')) {
            var wlkcid = new URL(e.parentElement.href).searchParams.get('wlkcid')
            displayDDL(e, wlkcid)
            displayOperations(e, wlkcid)
        }
    })

    if(!document.getElementById('calendarizer')) {
        var container = document.getElementById('suoxuecourse')
        var calendarButton = document.createElement('button')
        calendarButton.classList.add('operation')
        calendarButton.id = 'calendarizer'
        calendarButton.style.marginLeft = '1em'
        calendarButton.innerText = '导出所有课程至日历文件'
        calendarButton.onclick = calendarizeAll;
        container.parentElement.querySelector('dt.title').appendChild(calendarButton)
    }
}

function init() {
    if(!document.querySelector('.state.stu.clearfix .operations')) {
        customize()
    }
}

const homePath = '/f/wlxt/index/course/student/'
if (window.location.pathname === homePath) {
    if (document.querySelector('dd.stu') === null) {
        var container = document.getElementById('suoxuecourse')
        var observer = new MutationObserver(function () {
            if (document.querySelector('dd.stu') !== null) {
                setTimeout(function () {
                    init()
                }, 50)
            }
        })
        observer.observe(container, {
            attributes: false,
            childList: true,
            subtree: false
        })
    } else {
        init()
    }
}

var logo = document.querySelector('#banner .left a>img')
if (logo) {
    logo.parentElement.href = '#'
    var iconMap = document.createElement('map')
    iconMap.name = 'iconmap'
    var iconMapArea1 = document.createElement('area')
    var iconMapArea2 = document.createElement('area')
    Object.entries({
        shape: 'rect',
        coords: '0,0,115,47',
        href: homePath + 'index',
        title: '登录界面',
    }).forEach(entry => iconMapArea1.setAttribute(entry[0], entry[1]))
    Object.entries({
        shape: 'rect',
        coords: '115,0,202,47',
        href: homePath,
        title: '我的课程',
    }).forEach(entry => iconMapArea2.setAttribute(entry[0], entry[1]))
    iconMap.appendChild(iconMapArea1)
    iconMap.appendChild(iconMapArea2)
    logo.parentElement.appendChild(iconMap)
    logo.setAttribute('usemap', '#iconmap')
}
