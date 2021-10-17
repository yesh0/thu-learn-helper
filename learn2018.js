// ==UserScript==
// @icon         https://www.tsinghua.edu.cn/images/favicon.ico
// @name         网络学堂1202助手
// @namespace    exhen32@live.com
// @version      2021年10月17日00版
// @description  微调排版，提醒更醒目; 支持导出日历，课程一目了然；课件批量下载，公告一键标记，拯救强迫症。
// @require      http://cdn.bootcss.com/jquery/3.2.1/jquery.min.js
// @require      https://cdn.bootcss.com/jqueryui/1.12.1/jquery-ui.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @author       Exhen
// @match        http*://learn.tsinghua.edu.cn/f/wlxt/index/course/student/
// @connect      learn.tsinghua.edu.cn
// @updateURL    https://greasyfork.org/scripts/422447-%E7%BD%91%E7%BB%9C%E5%AD%A6%E5%A0%822018%E5%8A%A9%E6%89%8B/code/%E7%BD%91%E7%BB%9C%E5%AD%A6%E5%A0%822018%E5%8A%A9%E6%89%8B.user.js
// @run-at       document-start
// @updateURL    https://greasyfork.org/scripts/422447/code/user.js
// ==/UserScript==

var blocker = $('<div class="blocker" id="manualAlert" style="position: fixed;width: 100%;height: 100%;background: #4646466b;z-index: 999;"></div>')

$('head').append('<style type="text/css">.fixedCenter {left: 50%;position: absolute;right: 50%;top: 50%;bottom: 50%;}')

$('head').append('<style type="text/css">.myToobar {margin: 5px;display: inline-block;background: white;border: 1px solid gray;padding: 5px;border-radius: 5px; color:black} .myToobar a {color: black}')

var csrf = '';
var dummy = {
    "sEcho": 1,
    "iColumns": 8,
    "sColumns": ",,,,,,,",
    "iDisplayStart": 0,
    "iDisplayLength": "30",
    "mDataProp_0": "wz",
    "bSortable_0": false,
    "mDataProp_1": "bt",
    "bSortable_1": true,
    "mDataProp_2": "mxdxmc",
    "bSortable_2": true,
    "mDataProp_3": "zywcfs",
    "bSortable_3": true,
    "mDataProp_4": "kssj",
    "bSortable_4": true,
    "mDataProp_5": "jzsj",
    "bSortable_5": true,
    "mDataProp_6": "jzsj",
    "bSortable_6": true,
    "mDataProp_7": "function",
    "bSortable_7": false,
    "iSortCol_0": 5,
    "sSortDir_0": "desc",
    "iSortCol_1": 6,
    "sSortDir_1": "desc",
    "iSortingCols": 2,
    "wlkcid": "2021-2022-1142765385"
};
var shallowCopyObject = function(obj) {
    return Object.fromEntries(Object.entries(obj));
};
var fetchResponse = function(url, method, data) {
    return fetch(url.includes('?') ? (url + '&_csrf=' + csrf) : (url + '?_csrf=' + csrf),
          {
        method: method,
        headers: { 'Accept': 'application/json, text/javascript, */*; q=0.01',
                  'Cache-Control': 'max-age=0',
                  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'include',
        referrer: 'https://learn.tsinghua.edu.cn/',
        referrerPolicy: 'origin',
        body: method.toUpperCase() === 'POST' ? new URLSearchParams({
            "aoData": JSON.stringify(Object.entries(Object.assign(shallowCopyObject(dummy), data)).map(function(e) { return { 'name': e[0], 'value': e[1] } })) }) : undefined,
    });
};
var fetchJSON = function(url, method, meta, callback, data) {
    fetchResponse(url, method, data).then(function(response) {
        if(response.ok) {
            return response.json()
        } else {
            callback(null, meta, url)
        }
    }).then(function(json) { callback(json, meta, url) });
};
var getJSON = function (url, meta, callback) {
    fetchJSON(url, 'GET', meta, callback);
};

function PrefixInteger(num, length) {
    return (Array(length).join(0) + num).slice(-length);
}

function init(force) {
    if (force || (!document.getElementById("dUietC") && $('ul.stu').length)) {
        csrf = new URL($('.p_img>img')[0].src).searchParams.get('_csrf');
        var dUietC = document.createElement("a");
        dUietC.id = "dUietC";
        document.getElementsByTagName("html")[0].appendChild(dUietC);

        console.log('网络学堂2018助手 is running!')
        // 新通知数量重新排版
        $('.unsee').remove();
        $('li.clearfix').each(function () {
            $(this).css('height', '90px')
            $(this).css('padding', '8px 8px')
            if (parseInt($(this).find('span.stud').text()) > 0) {
                $(this).find('span.stud').css('font-size', '50px');
                $(this).find('span.stud').css('display', 'block');
                $(this).find('span.stud').css('padding-left', 'none');
                $(this).find('span.stud').css('text-align', 'center');
                //$(this).find('span.name').text($(this).find('span.liulan').text());
                $(this).find('span.liulan').remove();
            } else {
                $(this).find('span.stud').remove();
            }

        })
        $('ul.stu').each(function () {
            $(this).find('li').first().css('padding', '0px');
        })

        $('dd.stu').each(function () {
            // 图片提醒
            //var wlkcid = $(this).find('.hdtitle a').attr('href').match(/(?<=wlkcid=).*/);
            var wlkcid = $(this).find('.hdtitle a').attr('href').slice(43);
            $(this).attr('id', wlkcid)
            if (parseInt($(this).find('span.green').text()) > 0) {
                fetchJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kczy/zy/student/zyListWj`, 'POST', null, function (doc, meta, url) {
                    if (doc) {
                        var ddl = 0;
                        var now = new Date();
                        for (var i = 0; i < doc.object.iTotalRecords; i++) {
                            if (ddl <= 0 || (ddl > doc.object.aaData[i].jzsj && doc.object.aaData[i].jzsj > now.getTime())) {
                                ddl = doc.object.aaData[i].jzsj
                            }
                        }
                        console.log(ddl)
                        now = new Date();
                        var time = ddl - now.getTime();
                        console.log(time)
                        var days = Math.ceil(time / 86400000);
                        if (time <= 0) {
                            $(`#${wlkcid}`).find('li.clearfix').first().css('background-color', 'gray');
                            $(`#${wlkcid}`).find('li.clearfix').first().append(`<span style="color: red;font-size: 16px;padding:  10px 18px;line-height: 18px;width: 18px;text-align: center;display: block;float: right;">已经截止</span>`)
                        } else if (time <= 86400000) { //少于1天
                            $(`#${wlkcid}`).find('li.clearfix').first().css('background-color', 'red');
                            $(`#${wlkcid}`).find('li.clearfix').first().append(`<span style="color: black;font-size: 16px;padding:  10px 18px;line-height: 18px;width: 18px;text-align: center;display: block;float: right;">最后一天</span>`)
                        } else {
                            $(`#${wlkcid}`).find('li.clearfix').first().css('background-color', 'orange');
                            $(`#${wlkcid}`).find('li.clearfix').first().append(`<span style="color: red;font-size: 16px;padding: 10px 18px;line-height: 18px;width: 18px;text-align: center;display: block;float: right;">还剩<span style="text-align: center;">${days}</span>天</span>`)
                        }
                        $(`#${wlkcid}`).find('p.p_img').remove();
                    }
                }, { "wlkcid": wlkcid});
            } else {
                $(this).find('li.clearfix').first().css('background-color', 'lightgreen');
                $(this).find('li.clearfix').first().append(`<span style="color: black;font-size: 16px;padding: 10px 18px;line-height: 18px;width: 18px;text-align: center;display: block;float: right;">没有作业</span>`)
                $(this).find('p.p_img').remove();
            }

            // 导出日历
            var calendarBtn = $('<p class="calendar_btn myToobar"><a href="javascript:void(0)">导出上课时间到日历文件</a></p>');
            calendarBtn.click(function () {
                console.log($(this).attr('class'))
                var classTitle = $(this).parent().parent().find('a.stu').text().replace(/\(.*-.*\)/, '').trim();
                var classDesc = $(this).parent().parent().find('.stu_btn_pai span').last().attr('title');
                var classTeacher = $(this).parent().parent().find('.stu_btn span').text();
                var thisSems = $('#profile0-tab').attr('onClick').match(/\(.*-.*\)/)
                var classUntil = thisSems[0].split('-')[1] + (thisSems[0].split('-')[2] > 1 ? '0101' : '0701') + 'T000000Z';
                console.log(classDesc);
                if (classDesc && !classDesc.match('星期第0节')) {
                    for (var i = 0; i < classDesc.split(',').length; i++) {
                        var eachClass = classDesc.split(',')[i];
                        console.log(eachClass)
                        var classLocation = eachClass.split('，')[1];
                        var classTimeBegin = '',
                            classTimeEnd = $(),
                            classWeek = '';
                        switch (eachClass.match(/星期(.)/)[1]) {
                            case '日':
                                classWeek = 'SU';
                                break;
                            case '一':
                                classWeek = 'MO';
                                break;
                            case '二':
                                classWeek = 'TU';
                                break;
                            case '三':
                                classWeek = 'WE';
                                break;
                            case '四':
                                classWeek = 'TH';
                                break;
                            case '五':
                                classWeek = 'FR';
                                break;
                            case '六':
                                classWeek = 'SA';
                                break;
                        }
                        var now = new Date();
                        var today = PrefixInteger(now.getUTCFullYear(), 4) + PrefixInteger(now.getUTCMonth() + 1, 2) + PrefixInteger(now.getUTCDate(), 2);
                        switch (eachClass.match(/第(.)节/)[1]) {
                            case '1':
                                var classTimeBegin = today + 'T000000Z';
                                var classTimeEnd = today + 'T013500Z';
                                break;
                            case '2':
                                var classTimeBegin = today + 'T015000Z';
                                var classTimeEnd = today + 'T041500Z';
                                break;
                            case '3':
                                var classTimeBegin = today + 'T053000Z';
                                var classTimeEnd = today + 'T070500Z';
                                break;
                            case '4':
                                var classTimeBegin = today + 'T072000Z';
                                var classTimeEnd = today + 'T085500Z';
                                break;
                            case '5':
                                var classTimeBegin = today + 'T090500Z';
                                var classTimeEnd = today + 'T104000Z';
                                break;
                            case '6':
                                var classTimeBegin = today + 'T112000Z';
                                var classTimeEnd = today + 'T134500Z';
                                break;
                        }
                        var calendarData = `BEGIN:VCALENDAR\nVERSION:2.0\nMETHOD:PUBLISH\nBEGIN:VEVENT\nORGANIZER:${classTeacher}\nDTSTART;TZID=Asia/Shanghai:${classTimeBegin}\nDTEND;TZID=Asia/Shanghai:${classTimeEnd}\nRRULE:FREQ=WEEKLY;BYDAY=${classWeek};UNTIL=${classUntil};WKST=MO\nLOCATION:${classLocation}\nSUMMARY:${classTitle}（${classTeacher}）\nDESCRIPTION:${classDesc}\nPRIORITY:5\nCLASS:PUBLIC\nBEGIN:VALARM\nTRIGGER:-PT15M\nACTION:DISPLAY\nDESCRIPTION:Reminder\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
                        var file = new File([calendarData], (classTitle + '-' + i + '.ics'), {
                            type: "text/plain;charset=utf-8"
                        });
                        saveAs(file)
                    }
                    alert('日历文件下载成功，使用Outlook等邮件客户端打开即可将日历同步至邮件账户。')

                } else {
                    alert('课程时间错误，无法导出。')
                }

            })
            $(this).find('div.state.stu').append(calendarBtn);

            // 作业日历
            var ddlBtn = $('<p class="calendar_btn myToobar"><a href="javascript:void(0)">导出作业DDL到日历文件</a></p>');
            ddlBtn.click(function () {
                blockerTemp = blocker;
                blockerTemp.addClass('ddlBtn')
                $('body').prepend(blockerTemp);
                $('.blocker.ddlBtn').empty();
                $('.blocker.ddlBtn').append('<span class="fixedCenter" style="font-size:30px;color:white">Loading...</span>')
                if (parseInt($(this).parent().parent().parent().find('span.green').text()) > 0) {
                    var classTitle = $(this).parent().parent().find('a.stu').text().replace(/\(.*-.*\)/, '').trim();
                    var classTeacher = $(this).parent().parent().find('.stu_btn span').text();
                    getJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kczy/zy/student/index/zyListWj?wlkcid=${wlkcid}&size=999`, null, function (doc, meta, url) {
                        $('.blocker.ddlBtn').remove();
                        if (doc) {
                            var ddl = 0;
                            for (var i = 0; i < doc.object.iTotalRecords; i++) {
                                var current = doc.object.aaData[i];
                                var tempDate = new Date();
                                tempDate.setTime(current.jzsj - 3600000);
                                console.log(current.jzsj)
                                var tempDateBefore = new Date();
                                tempDateBefore.setTime(current.jzsj - 86400000 - 3600000);
                                var currDDL = PrefixInteger(tempDate.getUTCFullYear(), 4) + PrefixInteger(tempDate.getUTCMonth() + 1, 2) + PrefixInteger(tempDate.getUTCDate(), 2) + 'T' + PrefixInteger(tempDate.getUTCHours(), 2) + PrefixInteger(tempDate.getUTCMinutes(), 2) + PrefixInteger(tempDate.getUTCSeconds(), 2) + 'Z';
                                var currDDLBefore = PrefixInteger(tempDateBefore.getUTCFullYear(), 4) + PrefixInteger(tempDateBefore.getUTCMonth() + 1, 2) + PrefixInteger(tempDateBefore.getUTCDate(), 2) + 'T' + PrefixInteger(tempDateBefore.getUTCHours(), 2) + PrefixInteger(tempDateBefore.getUTCMinutes(), 2) + PrefixInteger(tempDateBefore.getUTCSeconds(), 2) + 'Z';
                                var currTitle = current.bt;

                                var calendarData = `BEGIN:VCALENDAR\nVERSION:2.0\nMETHOD:PUBLISH\nBEGIN:VEVENT\nORGANIZER:${classTeacher}\nDTSTART;TZID=Asia/Shanghai:${currDDLBefore}\nDTEND;TZID=Asia/Shanghai:${currDDL}\nSUMMARY:${currTitle}（${classTitle}）\nDESCRIPTION:${classTitle}（${classTeacher}），截止时间：${current.jzsjStr}\nPRIORITY:5\nCLASS:PUBLIC\nBEGIN:VALARM\nTRIGGER:-PT1440M\nACTION:DISPLAY\nDESCRIPTION:Reminder\nEND:VALARM\nEND:VEVENT\nEND:VCALENDAR`;
                                var file = new File([calendarData], (classTitle + '-' + PrefixInteger(i, 2) + '-' + currTitle + '.ics'), {
                                    type: "text/plain;charset=utf-8"
                                });
                                saveAs(file)

                            }
                            alert('日历文件下载成功，使用Outlook等邮件客户端打开即可将日历同步至邮件账户。')
                        } else {
                            alert('获取列表失败！请检查网络。')
                        }
                    })

                } else {
                    $('.blocker.ddlBtn').remove();
                    alert('暂时没有可以导出的DDL')
                }

                delete blockerTemp;
            })
            $(this).find('div.state.stu').append(ddlBtn);

            // 一键已读
            var notificationBtn = $('<p class="calendar_btn myToobar"><a href="javascript:void(0)">新公告一键标记已读</a></p>');

            notificationBtn.click(function () {
                var unreadNum = parseInt($(this).parent().parent().parent().find('span.orange.stud').text());
                if (unreadNum > 0) {
                    blockerTemp = blocker;
                    blockerTemp.attr('class', 'blocker notificationBtn')
                    $('body').prepend(blockerTemp);
                    $('.blocker.ddlBtn').empty();
                    $('.blocker.notificationBtn').append('<span class="fixedCenter" style="font-size:30px;color:white">Loading...</span>')
                    getJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kcgg/wlkc_ggb/student/kcggListXs?size=999&wlkcid=${wlkcid}`, null, function (doc, meta, url) {
                        $('.blocker.notificationBtn').remove();
                        if (doc) {
                            var unreadItems = doc.object.aaData.filter(function(e) { return e.sfyd === '否' });
                            if(unreadItems.length === 0) {
                                // TODO: alert
                            } else if(confirm(`按确认键将以下公告设为已读：\n${unreadItems.map(function(e) { return '- ' + e.bt }).join('\n\n')}`)) {
                                let total = unreadItems.length;
                                let count = 0;
                                let successNum = 0;
                                var handleResponse = function(response) {
                                    count++;
                                    if(response.ok) { ++successNum; }
                                    if (total === count) {
                                        if (successNum === count) {
                                            alert('一键已读成功！');
                                            location.reload();
                                        } else {
                                            alert(`${unreadNum-successNum}/${unreadNum}条公告标记已读失败！`);
                                            location.reload();
                                        }
                                    }
                                };
                                for(var e of unreadItems) {
                                    fetchResponse(`http://learn.tsinghua.edu.cn/f/wlxt/kcgg/wlkc_ggb/student/beforeViewXs?wlkcid=${wlkcid}&id=${e.ggid}`, 'GET')
                                    .then(handleResponse);
                                }
                            }
                            if (unreadItems.length !== unreadNum) {
                                alert('学堂系统BUG，未读数量显示不对，建议反馈给ITS！')
                            }
                        } else {
                            alert('获取列表失败！请检查网络。')
                        }
                    })
                    delete blockerTemp
                } else {
                    alert('没有未读公告。')
                }
            })

            $(this).find('div.state.stu').append(notificationBtn);

            // 批量下载
            function downloadFromJson(doc, flagForOld, downloadList, names) {
                var totalSize = 0;
                console.log(doc);
                for (var i = 0; i < doc.object.length; i++) {
                    if (!flagForOld && !doc.object[i].isNew) {
                        continue;
                    }
                    downloadList.push(doc.object[i].wjid);
                    names.push(doc.object[i].bt);
                    totalSize = totalSize + doc.object[i].wjdx;
                }
                return totalSize
            }

            function getFileSize(fileByte) {
                var fileSizeByte = fileByte;
                var fileSizeMsg = "";
                if (fileSizeByte < 1048576) fileSizeMsg = (fileSizeByte / 1024).toFixed(2) + "KB";
                else if (fileSizeByte == 1048576) fileSizeMsg = "1MB";
                else if (fileSizeByte > 1048576 && fileSizeByte < 1073741824) fileSizeMsg = (fileSizeByte / (1024 * 1024)).toFixed(2) + "MB";
                else if (fileSizeByte > 1048576 && fileSizeByte == 1073741824) fileSizeMsg = "1GB";
                else if (fileSizeByte > 1073741824 && fileSizeByte < 1099511627776) fileSizeMsg = (fileSizeByte / (1024 * 1024 * 1024)).toFixed(2) + "GB";
                else fileSizeMsg = "超过1TB";
                return fileSizeMsg;
            }

            var attachmentAllBtn = $('<p class="calendar_btn myToobar"><a href="javascript:void(0)">全部课件批量下载</a></p>');
            attachmentAllBtn.click(function () {
                blockerTemp = blocker;
                blockerTemp.attr('class', 'blocker attachmentAllBtn')
                $('body').prepend(blockerTemp);
                $('.blocker.ddlBtn').empty();
                $('.blocker.attachmentAllBtn').append('<span class="fixedCenter" style="font-size:30px;color:white">Loading...</span>')
                getJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kj/wlkc_kjxxb/student/kjxxbByWlkcidAndSizeForStudent?size=999&wlkcid=${wlkcid}`, null, function (doc, meta, url) {
                    $('.blocker.attachmentAllBtn').remove();
                    if (doc) {
                        // console.log(doc)
                        var downloadList = [];
                        var names = [];
                        var totalSize = downloadFromJson(doc, true, downloadList, names);
                        // console.log(downloadList, totalSize)
                        if (downloadList.length) {
                            if (confirm(`按确认键开始下载全部${downloadList.length}个文件（共计${getFileSize(totalSize)}）：\n`
                                        + `${'《' + names.join('》\n《') + '》'}。\n`
                                        + `如果下载未开始，请检查浏览器是否拦截了本网页的弹出窗口（例如Chrome地址栏最右侧出现带小红叉的图标）`)) {
                                for (var i = 0; i < downloadList.length; i++) {
                                    window.open('http://learn.tsinghua.edu.cn/b/wlxt/kj/wlkc_kjxxb/student/downloadFile?sfgk=0&wjid=' + downloadList[i])
                                }
                            }
                        } else {
                            alert('暂时无文件供下载。')
                        }

                    } else {
                        alert('获取列表失败！请检查网络。')
                    }
                })
                delete blockerTemp;
            })
            $(this).find('div.state.stu').append(attachmentAllBtn);
            var attachmentNewBtn = $('<p class="calendar_btn myToobar"><a href="javascript:void(0)">新课件批量下载</a></p>');
            attachmentNewBtn.click(function () {
                blockerTemp = blocker;
                blockerTemp.attr('class', 'blocker attachmentNewBtn')
                $('body').prepend(blockerTemp);
                $('.blocker.ddlBtn').empty();
                $('.blocker.attachmentNewBtn').append('<span class="fixedCenter" style="font-size:30px;color:white">Loading...</span>')
                getJSON(`http://learn.tsinghua.edu.cn/b/wlxt/kj/wlkc_kjxxb/student/kjxxbByWlkcidAndSizeForStudent?size=999&wlkcid=${wlkcid}`, null, function (doc, meta, url) {
                    $('.blocker.attachmentNewBtn').remove();
                    if (doc) {
                        console.log(doc)
                        var downloadList = [];
                        var names = [];
                        var totalSize = downloadFromJson(doc, false, downloadList, names);
                        console.log(downloadList, totalSize)
                        if (downloadList.length) {
                            if (confirm(`按确认键开始下载全部${downloadList.length}个文件（共计${getFileSize(totalSize)}）：\n`
                                        + `${'《' + names.join('》\n《') + '》'}。\n`
                                        + `如果下载未开始，请检查浏览器是否拦截了本网页的弹出窗口（例如Chrome地址栏最右侧出现带小红叉的图标）`)) {
                                for (var i = 0; i < downloadList.length; i++) {
                                    window.open('http://learn.tsinghua.edu.cn/b/wlxt/kj/wlkc_kjxxb/student/downloadFile?sfgk=0&wjid=' + downloadList[i])
                                }
                            }
                        } else {
                            alert('暂时无文件供下载。')
                        }

                    } else {
                        alert('获取列表失败！请检查网络。')
                    }
                })
                delete blockerTemp;
            })
            $(this).find('div.state.stu').append(attachmentNewBtn);

        })

        return true
    } else {
        console.log('nothing happened!')
        return false
    }
}

window.addEventListener('load', function () {
    var icon = $('<div id="manualScript"><a ref="javascript:void(0);"><i class="webicon-recycle"></i>手动加载</a></div>');
    icon.find('a').click(function () {
        init(true);
    });
    $('div.header div.w div.right').append(icon)

    if(document.querySelector('dd.stu') === null) {
        var container = document.getElementById('suoxuecourse');
        var observer = new MutationObserver(function() {
            if(document.querySelector('dd.stu') !== null) {
                setTimeout(function() { init(true); }, 100);
            }
        });
        observer.observe(container, { attributes: false, childList: true, subtree: false });
    } else {
      init();
    }
})
