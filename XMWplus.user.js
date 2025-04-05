// ==UserScript==
// @name         小码王Plus
// @version      1.6.0
// @description  使你的小码王更易于使用
// @author       RSPqfgn
// @match        https://world.xiaomawang.com/*
// @icon         https://world.xiaomawang.com/favicon.ico
// @license      MIT
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://cdn.bootcdn.net/ajax/libs/sweetalert2/11.11.0/sweetalert2.all.min.js
// ==/UserScript==

// 添加CSS样式规则
GM_addStyle(`
body[data-page="index"] .sticky-outer-wrapper:not(.active) .xiaoma__3Eq2i {
    display: none !important;
}
`);

// 监听滚动事件来控制logo显示
function updateLogoVisibility() {
    // 检查当前页面URL是否为首页
    if (window.location.href === 'https://world.xiaomawang.com/w/index') {
        const stickyWrapper = document.querySelector('.sticky-outer-wrapper');
        if (stickyWrapper) {
            if (window.scrollY > 0) {
                stickyWrapper.classList.add('active');
            } else {
                stickyWrapper.classList.remove('active');
            }
        }
        // 添加页面标识
        document.body.setAttribute('data-page', 'index');
    }
}

window.addEventListener('scroll', updateLogoVisibility);

// 在页面加载完成后立即检查状态
window.addEventListener('load', () => {
    updateLogoVisibility();
    addXMWPlusButton();
});
(function () {
    'use strict';
// 初始化设置
const settings = {
    autoReceive: GM_getValue('autoReceive', true), // 自动领取奖励
    autoSignIn: GM_getValue('autoSignIn', true), // 自动签到
    autoLoadComments: GM_getValue('autoLoadComments', true), // 自动展开评论
    autoExpandReplies: GM_getValue('autoExpandReplies', false), // 自动展开子回复
    autoClickMore: GM_getValue('autoClickMore', true), // 自动点击个人主页中查看更多按钮
    messageDoNotDisturb: GM_getValue('messageDoNotDisturb', false), // 消息免打扰
    removeDynamicRedDot: GM_getValue('removeDynamicRedDot', false), // 动态免打扰
    removeAvatarFrame: GM_getValue('removeAvatarFrame', false), // 移除头像框
    removeMagicReview: GM_getValue('removeMagicReview', false), // 移除右下角魔力测评
    taskCenterDoNotDisturb: GM_getValue('taskCenterDoNotDisturb', false), // 任务中心免打扰
    adaptiveTextbox: GM_getValue('adaptiveTextbox', false), // 自适应文本框
    autoCheckUpdate: GM_getValue('autoCheckUpdate', true) // 自动检查更新
};

// 注册命令
GM_registerMenuCommand('查询', performQuery);
GM_registerMenuCommand('自动任务', autoCompleteTask);
GM_registerMenuCommand('设置', openSettingsDialog);

// 添加XMW+按钮和下拉菜单
function addXMWPlusButton() {
    const mainNav = document.querySelector('.main-nav__120BM ul.main-link-wrap__7VwqL');
    if (!mainNav) return;

    // 检查是否已存在XMW+按钮
    const existingButton = Array.from(mainNav.children).find(li =>
        li.querySelector('a')?.textContent === 'XMW+');
    if (existingButton) return;

    // 添加菜单样式
    GM_addStyle(`
        .xmwplus-nav {
            position: relative;
        }
        .xmwplus-button {
            display: flex;
            align-items: center;
            padding: 0 16px;
            height: 100%;
            color: #333;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .xmwplus-button:hover {
            color: #007bff;
        }
        .xmwplus-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.1);
            padding: 8px 0;
            min-width: 120px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        }
        .xmwplus-nav:hover .xmwplus-menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        .xmwplus-menu-item {
            padding: 8px 16px;
            color: #333;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            width: 120px;
            justify-content: center;
        }
        .xmwplus-menu-item:hover {
            background: #f5f5f5;
            color: #007bff;
        }
    `);

    // 创建XMW+按钮
    const xmwPlusLi = document.createElement('li');
    xmwPlusLi.innerHTML = `
        <div class="xmwplus-nav">
            <a class="xmwplus-button">XMW+</a>
            <ul class="xmwplus-menu">
                <li><a class="xmwplus-menu-item" id="xmwplus-query">查询</a></li>
                <li><a class="xmwplus-menu-item" id="xmwplus-task">自动任务</a></li>
                <li><a class="xmwplus-menu-item" id="xmwplus-settings">设置</a></li>
            </ul>
        </div>
    `;

    // 插入到社区共建按钮后
    const communityBuildingLi = Array.from(mainNav.children).find(li => 
        li.textContent.includes('社区共建'));
    if (communityBuildingLi) {
        mainNav.insertBefore(xmwPlusLi, communityBuildingLi.nextSibling);
    } else {
        mainNav.appendChild(xmwPlusLi);
    }

    // 添加点击事件
    document.getElementById('xmwplus-query').addEventListener('click', performQuery);
    document.getElementById('xmwplus-task').addEventListener('click', autoCompleteTask);
    document.getElementById('xmwplus-settings').addEventListener('click', openSettingsDialog);
}

// 监听顶栏变化
function observeNavbar() {
    // 每秒检查一次XMW+按钮是否存在
    setInterval(() => {
        const mainNav = document.querySelector('.main-nav__120BM ul.main-link-wrap__7VwqL');
        if (mainNav) {
            const existingButton = Array.from(mainNav.children).find(li =>
                li.querySelector('a')?.textContent === 'XMW+');
            if (!existingButton) {
                addXMWPlusButton();
            }
        }
    }, 1000);
}

// 在页面加载完成后添加按钮并开始监听
window.addEventListener('load', () => {
    addXMWPlusButton();
    observeNavbar();
});

// 在页面加载完成后添加按钮
window.addEventListener('load', addXMWPlusButton);
// 查询功能
function performQuery() {
    Swal.fire({
        title: '查询',
        html: `
<style>
/* 样式定义 */
.query-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.query-group {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
}

.query-group label {
    font-weight: bold;
}

.query-group input {
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    flex: 1;
}

.query-group .button-container {
    display: flex;
    flex-direction: row;
    gap: 5px;
}

.query-group button {
    padding: 5px 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    transition: background-color 0.3s;
}

.query-group button:hover {
    background-color: #0056b3;
}

/* 新增结果展示区域样式 */
.query-result {
    margin-top: 15px;
    padding: 10px;
    border-top: 1px solid #eee;
    max-height: 200px;
    overflow-y: auto;
}

.result-item {
    margin: 5px 0;
    color: #333;
    text-align: left; /* 使文本左侧对齐 */
}

.error-message {
    color: #dc3545;
    font-weight: bold;
}

.result-item strong {
    color: #666;
    min-width: 70px;
    display: inline-block;
}
</style>

<div class="query-container">
    <div class="query-group">
        <label for="userQuery">用户查询</label>
        <input type="text" id="userQuery" placeholder="输入用户ID">
        <div class="button-container">
            <button id="userQueryButton">查询</button>
            <button id="userJumpButton">快速跳转</button>
        </div>
    </div>
    <div class="query-group">
        <label for="workQuery">作品查询</label>
        <input type="text" id="workQuery" placeholder="输入作品ID">
        <div class="button-container">
            <button id="workQueryButton">查询</button>
            <button id="workJumpButton">快速跳转</button>
        </div>
    </div>
    <div class="query-group">
        <label for="studioQuery">工作室查询</label>
        <input type="text" id="studioQuery" placeholder="输入工作室ID">
        <div class="button-container">
            <button id="studioQueryButton">查询</button>
            <button id="studioJumpButton">快速跳转</button>
        </div>
    </div>
    <!-- 新增结果展示容器 -->
    <div class="query-result" id="queryResult"></div>
</div>
`,
        showCloseButton: true, // 启用默认关闭按钮
        showCancelButton: false,
        showConfirmButton: false,
        width: '600px',
        heightAuto: true,
        padding: '20px',
        didOpen: () => {
            const userQueryButton = Swal.getPopup().querySelector('#userQueryButton');
            const userJumpButton = Swal.getPopup().querySelector('#userJumpButton');
            const workQueryButton = Swal.getPopup().querySelector('#workQueryButton');
            const workJumpButton = Swal.getPopup().querySelector('#workJumpButton');
            const studioQueryButton = Swal.getPopup().querySelector('#studioQueryButton');
            const studioJumpButton = Swal.getPopup().querySelector('#studioJumpButton');

            userQueryButton.addEventListener('click', async () => {
                const query = Swal.getPopup().querySelector('#userQuery').value;
                const resultContainer = Swal.getPopup().querySelector('#queryResult');
                
                if (!query) {
                    Swal.fire({
                        title: '错误',
                        text: '请输入用户ID',
                        icon: 'error',
                        confirmButtonText: '确定'
                    });
                    return;
                }

                // 显示加载状态
                resultContainer.innerHTML = '<div>查询中...</div>';

                try {
                    const html = await fetchUserPage(query);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // 检查错误页面
                    const errorTitle = doc.querySelector('.title__3aW-0');
                    if (errorTitle?.innerHTML.includes('去火星了')) {
                        resultContainer.innerHTML = `<div class="error-message">查询失败，用户可能不存在</div>`;
                        return;
                    }

                    // 提取信息
                    const userInfo = {
                        name: doc.querySelector('.topheader__NickName-sc-13u5cd2-0.gjUfHk')?.textContent || '未获取',
                        bio: doc.querySelector('.privateSigNoInput__1vOhM')?.textContent || '暂无简介',
                        gender: extractInfo(doc, '性别：'),
                        age: extractInfo(doc, '年龄：'),
                        city: extractInfo(doc, '城市：'),
                        school: extractInfo(doc, '学校：'),
                        studio: extractStudioInfo(doc) // 修改为使用专用函数提取工作室信息
                    };

                    // 构建展示内容
                    resultContainer.innerHTML = `
                        <div class="result-item"><strong>用户名：</strong>${userInfo.name}</div>
                        <div class="result-item"><strong>个人简介：</strong>${userInfo.bio}</div>
                        <div class="result-item"><strong>性别：</strong>${userInfo.gender}</div>
                        <div class="result-item"><strong>年龄：</strong>${userInfo.age}</div>
                        <div class="result-item"><strong>城市：</strong>${userInfo.city}</div>
                        <div class="result-item"><strong>学校：</strong>${userInfo.school}</div>
                        <div class="result-item"><strong>工作室：</strong>${userInfo.studio}</div>
                    `;
                } catch (error) {
                    resultContainer.innerHTML = `<div class="error-message">查询失败：${error.message}</div>`;
                }
            });

            userJumpButton.addEventListener('click', () => {
                const query = Swal.getPopup().querySelector('#userQuery').value;
                // 处理用户快速跳转逻辑
                if (query) {
                    window.open(`https://world.xiaomawang.com/w/person/project/all/${query}`, '_blank');
                } else {
                    Swal.fire({
                        title: '错误',
                        text: '请输入用户ID',
                        icon: 'error',
                        confirmButtonText: '确定'
                    });
                }
            });

            workQueryButton.addEventListener('click', async () => {
                const query = Swal.getPopup().querySelector('#workQuery').value;
                const resultContainer = Swal.getPopup().querySelector('#queryResult');
                
                if (!query) {
                    Swal.fire({
                        title: '错误',
                        text: '请输入作品ID',
                        icon: 'error',
                        confirmButtonText: '确定'
                    });
                    return;
                }

                // 显示加载状态
                resultContainer.innerHTML = '<div>查询中...</div>';

                try {
                    const html = await fetchWorkPage(query);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // 检查错误页面
                    const errorTitle = doc.querySelector('.title__3tuHf');
                    if (errorTitle?.textContent === '咦～～页面不存在或已经被删除了') {
                        resultContainer.innerHTML = `<div class="error-message">查询失败，作品可能不存在</div>`;
                        return;
                    }

                    // 提取信息
                    const workInfo = {
                        title: doc.querySelector('.title__9ezjz')?.textContent || '未获取作品名',
                        author: extractAuthorInfo(doc),
                        description: extractIntroContent(doc, '作品说明'),
                        instructions: extractIntroContent(doc, '操作说明')
                    };

                    // 构建展示内容
                    resultContainer.innerHTML = `
                        <div class="result-item"><strong>作品名：</strong>${workInfo.title}</div>
                        <div class="result-item"><strong>作者：</strong>${workInfo.author}</div>
                        <div class="result-item"><strong>作品说明：</strong>${workInfo.description}</div>
                        <div class="result-item"><strong>操作说明：</strong>${workInfo.instructions}</div>
                    `;
                } catch (error) {
                    resultContainer.innerHTML = `<div class="error-message">查询失败：${error.message}</div>`;
                }
            });

            workJumpButton.addEventListener('click', () => {
                const query = Swal.getPopup().querySelector('#workQuery').value;
                // 处理作品快速跳转逻辑
                if (query) {
                    window.open(`https://world.xiaomawang.com/community/main/compose/${query}`, '_blank');
                } else {
                    Swal.fire({
                        title: '错误',
                        text: '请输入作品ID',
                        icon: 'error',
                        confirmButtonText: '确定'
                    });
                }
            });

            studioQueryButton.addEventListener('click', async () => {
                const query = Swal.getPopup().querySelector('#studioQuery').value;
                const resultContainer = Swal.getPopup().querySelector('#queryResult');
                
                if (!query) {
                    Swal.fire({
                        title: '错误',
                        text: '请输入工作室ID',
                        icon: 'error',
                        confirmButtonText: '确定'
                    });
                    return;
                }

                // 显示加载状态
                resultContainer.innerHTML = '<div>查询中...</div>';

                try {
                    const studioHtml = await fetchStudioPage(query);
                    const parser = new DOMParser();
                    const studioDoc = parser.parseFromString(studioHtml, 'text/html');

                    // 检查错误页面
                    const errorTitle = studioDoc.querySelector('.title__3aW-0');
                    if (errorTitle?.innerHTML.includes('去火星了')) {
                        resultContainer.innerHTML = `<div class="error-message">查询失败，工作室可能不存在</div>`;
                        return;
                    }

                    // 提取工作室信息
                    const studioInfo = {
                        name: studioDoc.querySelector('.studioInfoName__delqu')?.textContent || '未获取工作室名',
                        intro: studioDoc.querySelector('.studioInfoIntro__NEpAa')?.textContent || '暂无简介',
                        slogan: studioDoc.querySelector('.sloganText__1YmZ3')?.textContent || '暂无标语',
                        bulletin: extractBulletinContent(studioDoc)
                    };

                    // 获取室长信息
                    const membersHtml = await fetchStudioMembersPage(query);
                    const membersDoc = parser.parseFromString(membersHtml, 'text/html');
                    const masterInfo = extractMasterInfo(membersDoc);

                    // 构建展示内容
                    resultContainer.innerHTML = `
                        <div class="result-item"><strong>工作室名：</strong>${studioInfo.name}</div>
                        <div class="result-item"><strong>简介：</strong>${studioInfo.intro}</div>
                        <div class="result-item"><strong>标语：</strong>${studioInfo.slogan}</div>
                        <div class="result-item"><strong>室长：</strong>${masterInfo}</div>
                        <div class="result-item"><strong>公告栏：</strong>${studioInfo.bulletin}</div>
                    `;
                } catch (error) {
                    resultContainer.innerHTML = `<div class="error-message">查询失败：${error.message}</div>`;
                }
            });

            studioJumpButton.addEventListener('click', () => {
                const query = Swal.getPopup().querySelector('#studioQuery').value;
                // 处理工作室快速跳转逻辑
                if (query) {
                    window.open(`https://world.xiaomawang.com/w/studio-home/${query}`, '_blank');
                } else {
                    Swal.fire({
                        title: '错误',
                        text: '请输入工作室ID',
                        icon: 'error',
                        confirmButtonText: '确定'
                    });
                }
            });

            // 提取信息的辅助函数
            function extractInfo(doc, keyword) {
                const infoDivs = doc.querySelectorAll('.leftInfo__nPDRc div');
                for (const div of infoDivs) {
                    const text = div.textContent;
                    if (text.includes(keyword)) {
                        return text.split('：')[1]?.trim() || '-';
                    }
                }
                return '-';
            }

            // 提取作者信息的辅助函数
            function extractAuthorInfo(doc) {
                const authorElement = doc.querySelector('.info-box__NickName-h550h7-0.efhaqR.userNickname__1KEoN');
                if (!authorElement) return '未知作者';
                
                const authorLink = authorElement.closest('a')?.getAttribute('href') || '';
                const fullLink = `https://world.xiaomawang.com${authorLink}`;
                return `<a href="${fullLink}" target="_blank">${authorElement.textContent}</a>`;
            }

            // 提取说明内容的辅助函数
            function extractIntroContent(doc, titleText) {
                const introItems = doc.querySelectorAll('.intro-item__2THvN');
                for (const item of introItems) {
                    const title = item.querySelector('.intro-title__3Q47k');
                    if (title?.textContent === titleText) {
                        // 使用 textContent 提取文本内容并替换换行符
                        const content = item.querySelector('div:not(.intro-title__3Q47k)')?.textContent || '暂无内容';
                        return content.replace(/\n/g, '<br>');
                    }
                }
                return '暂无内容';
            }

            // 提取工作室信息的辅助函数
            function extractStudioInfo(doc) {
                const studioElement = doc.querySelector('.leftStudioLogoName__3vgsY');
                if (!studioElement) return '未加入工作室';
                
                const studioLink = studioElement.closest('a')?.getAttribute('href') || '';
                if (!studioLink) return studioElement.textContent;
                
                const fullLink = `https://world.xiaomawang.com${studioLink}`;
                return `<a href="${fullLink}" target="_blank">${studioElement.textContent}</a>`;
            }

            // 提取公告栏内容的辅助函数
            function extractBulletinContent(doc) {
                const bulletinElement = doc.querySelector('.bulletinBody__1NP_v');
                if (!bulletinElement) return '暂无公告';
                
                // 使用 textContent 提取文本内容并替换换行符
                const content = bulletinElement.textContent || '暂无公告';
                return content.replace(/\n/g, '<br>');
            }

            // 提取室长信息的辅助函数
            function extractMasterInfo(doc) {
                const masterElement = doc.querySelector('.nickname__2KqRn');
                if (!masterElement) return '未知室长';
                
                const masterLink = masterElement.closest('a')?.getAttribute('href') || '';
                const fullLink = `https://world.xiaomawang.com${masterLink}`;
                return `<a href="${fullLink}" target="_blank">${masterElement.textContent}</a>`;
            }

            // 获取用户页面的函数（需要GM_xmlhttpRequest）
            async function fetchUserPage(id) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `https://world.xiaomawang.com/w/person/project/all/${id}`,
                        onload: (response) => {
                            if (response.status === 200) {
                                resolve(response.responseText);
                            } else {
                                reject(new Error(`HTTP错误 ${response.status}`));
                            }
                        },
                        onerror: (error) => reject(error)
                    });
                });
            }

            // 获取作品页面的函数（需要GM_xmlhttpRequest）
            async function fetchWorkPage(id) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `https://world.xiaomawang.com/community/main/compose/${id}`,
                        onload: (response) => {
                            if (response.status === 200) {
                                resolve(response.responseText);
                            } else {
                                reject(new Error(`HTTP错误 ${response.status}`));
                            }
                        },
                        onerror: (error) => reject(error)
                    });
                });
            }

            // 获取工作室页面的函数（需要GM_xmlhttpRequest）
            async function fetchStudioPage(id) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `https://world.xiaomawang.com/w/studio-home/${id}`,
                        onload: (response) => {
                            if (response.status === 200) {
                                resolve(response.responseText);
                            } else {
                                reject(new Error(`HTTP错误 ${response.status}`));
                            }
                        },
                        onerror: (error) => reject(error)
                    });
                });
            }

            // 获取工作室成员页面的函数（需要GM_xmlhttpRequest）
            async function fetchStudioMembersPage(id) {
                return new Promise((resolve, reject) => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `https://world.xiaomawang.com/w/studio-members?studioId=${id}`,
                        onload: (response) => {
                            if (response.status === 200) {
                                resolve(response.responseText);
                            } else {
                                reject(new Error(`HTTP错误 ${response.status}`));
                            }
                        },
                        onerror: (error) => reject(error)
                    });
                });
            }
        }
    });
}

//自动任务
function autoCompleteTask() {
    Swal.fire({
        title: '自动任务',
        html: `
            <div>正在开发，敬请期待</div>
            <div style="text-decoration: line-through; color: gray;">屑红石镐又在画饼了</div>
        `,
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: '确定',
        width: '400px',
        padding: '20px'
    });
}

//设置
function openSettingsDialog() {
    Swal.fire({
        title: '设置',
        html:  `
<style>
/* 样式定义 */
.button-container {
    display: flex; /* 使用 Flexbox */
    justify-content: flex-start; /* 紧挨着的排列 */
    margin-bottom: 20px; /* 按钮底部的间距 */
}

.section {
    margin-right: 10px; /* 右侧间距，留一点距离 */
    font-weight: bold; /* 加粗分类标题 */
    cursor: pointer; /* 鼠标手势 */
    padding: 10px;
    background-color: #f0f0f0; /* 背景色 */
    border-radius: 4px;
}

.section.active { /* 高亮样式 */
    background-color: #007bff; /* 高亮背景色 */
    color: white; /* 高亮字体颜色 */
}

.custom-confirm-button {
    background-color: #007bff !important; /* 确认按钮颜色 */
    color: white !important; /* 确认按钮字体颜色 */
    border-radius: 8px; /* 按钮圆角 */
}

.custom-confirm-button:hover {
    background-color: #0056b3 !important; /* 悬停时的颜色 */
}

.custom-cancel-button {
    background-color: #ccc; /* 取消按钮颜色 */
    color: white; /* 字体颜色 */
    border-radius: 8px; /* 按钮圆角 */
}

.custom-cancel-button:hover {
    background-color: #bbb; /* 悬停时的颜色 */
}

.hidden {
    display: none; /* 隐藏 */
}

/* 其他勾选框样式 */
.custom-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: 10px; /* 增加标签间距 */
}

.custom-checkbox input[type="checkbox"] {
    appearance: none; /* 关闭默认样式 */
    width: 24px; /* 自定义勾选框大小 */
    height: 24px; /* 自定义勾选框大小 */
    border: 2px solid #007bff; /* 勾选框边框 */
    border-radius: 4px; /* 勾选框圆角 */
    outline: none; /* 关闭默认高亮 */
    cursor: pointer; /* 鼠标手势 */
    position: relative; /* 设为相对定位 */
    margin-right: 10px; /* 标签和勾选框间隔 */
    transition: background-color 0.3s, border-color 0.3s; /* 动效 */
}

.custom-checkbox input[type="checkbox"]:checked {
    background-color: #007bff; /* 勾选框背景颜色 */
    border-color: #007bff; /* 选中后的边框颜色 */
}

.custom-checkbox input[type="checkbox"]:checked::before {
    content: '✔'; /* 勾选后显示的符号 */
    position: absolute;
    left: 50%; /* 符号水平居中 */
    top: 50%; /* 符号垂直居中 */
    transform: translate(-50%, -50%); /* 调整符号位置 */
    color: white; /* 符号颜色 */
    font-size: 18px; /* 符号大小 */
}
.about-section {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    text-align: left;
}

.about-item {
    margin: 8px 0;
    color: #666;
}


</style>

<div class="button-container">
    <div id="taskSection" class="section active">自动任务</div>
    <div id="customSection" class="section">界面定制</div>
    <div id="aboutSection" class="section">关于</div>
</div>

<div id="taskSettings">
    <label class="custom-checkbox">
        <input type="checkbox" name="autoReceive" ${settings.autoReceive ? 'checked' : ''}> 自动领取奖励
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="autoSignIn" ${settings.autoSignIn ? 'checked' : ''}> 自动签到
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="autoLoadComments" ${settings.autoLoadComments ? 'checked' : ''}> 自动展开评论
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="autoExpandReplies" ${settings.autoExpandReplies ? 'checked' : ''}> 自动展开子回复
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="autoClickMore" ${settings.autoClickMore ? 'checked' : ''}> 自动点击查看更多
    </label><br/>
</div>

<div id="customSettings" class="hidden">
    <label class="custom-checkbox">
        <input type="checkbox" name="messageDoNotDisturb" ${settings.messageDoNotDisturb ? 'checked' : ''}> 消息免打扰
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="removeDynamicRedDot" ${settings.removeDynamicRedDot ? 'checked' : ''}> 动态免打扰
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="taskCenterDoNotDisturb" ${settings.taskCenterDoNotDisturb ? 'checked' : ''}> 任务中心免打扰
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="removeAvatarFrame" ${settings.removeAvatarFrame ? 'checked' : ''}> 移除头像框
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="removeMagicReview" ${settings.removeMagicReview ? 'checked' : ''}> 移除右下角魔力测评
    </label><br/>
    <label class="custom-checkbox">
        <input type="checkbox" name="adaptiveTextbox" ${settings.adaptiveTextbox ? 'checked' : ''}> 自适应文本框(beta)
    </label><br/>
</div>

<div id="aboutSettings" class="hidden">
    <div class="about-section">
        <div class="about-item"><strong>小码王Plus</strong></div>
        <div class="about-item"><strong>版本：</strong>v${GM_info.script.version}</div>
        <div class="about-item"><strong>作者：</strong>RSPqfgn</div>
        <div class="about-item"><strong>许可证：</strong>MIT</div>
        <div class="about-item" style="display: flex; align-items: center;">
            <button id="checkUpdateBtn" style="background-color: #007bff; color: white; border: none; border-radius: 8px; padding: 8px 16px; cursor: pointer; transition: background-color 0.3s; margin-right: 10px;">检查更新</button>
            <span id="updateStatus" style="color: #666;"></span>
        </div>
        <label class="custom-checkbox">
            <input type="checkbox" name="autoCheckUpdate" ${settings.autoCheckUpdate ? 'checked' : ''}>
            每天自动检查更新
        </label>
    </div>
</div>
`,
        showCancelButton: true,
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        customClass: {
            confirmButton: 'custom-confirm-button',
            cancelButton: 'custom-cancel-button'
        },
        // 修改后的 didOpen 回调：

didOpen: () => {
            // 获取检查更新按钮和状态文本元素
            const checkUpdateBtn = document.getElementById('checkUpdateBtn');
            const updateStatus = document.getElementById('updateStatus');

            // 检查更新按钮点击事件处理函数
            async function handleUpdateCheck() {
                // 禁用按钮并更改文本
                checkUpdateBtn.disabled = true;
                checkUpdateBtn.textContent = '检查中';
                checkUpdateBtn.style.backgroundColor = '#ccc';
                updateStatus.textContent = '';

                try {
                    let latestVersion = null;
                    let updateUrl = null;

                    // 尝试主站检查
                    try {
                        const response = await fetch('https://api.github.com/repos/RSPqfgn/XMWplus/releases/latest');
                        const data = await response.json();
                        latestVersion = data.tag_name.replace('v', '');
                        updateUrl = data.html_url;
                    } catch {
                        // 主站失败尝试镜像站
                        const mirrorResponse = await fetch('https://bgithub.xyz/RSPqfgn/XMWplus/releases');
                        const mirrorHtml = await mirrorResponse.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(mirrorHtml, 'text/html');
                        const releaseLink = doc.querySelector('.release-header a[href*="/releases/tag/"]');
                        latestVersion = releaseLink?.href.split('/').pop().replace(/^v/, '');
                        updateUrl = 'https://bgithub.xyz/RSPqfgn/XMWplus/releases';
                    }

                    if (!latestVersion) {
                        throw new Error('无法获取版本信息');
                    }

                    const currentVersion = GM_info.script.version;
                    //const currentVersion = '1.0.0';//测试用

                    if (latestVersion > currentVersion) {
                        // 有新版本时将按钮改为前往更新
                        checkUpdateBtn.textContent = '前往更新';
                        checkUpdateBtn.disabled = false;
                        checkUpdateBtn.style.backgroundColor = '#007bff';
                        // 移除原有的事件监听器
                        checkUpdateBtn.removeEventListener('click', handleUpdateCheck);
                        // 添加新的跳转事件
                        checkUpdateBtn.onclick = () => window.open(updateUrl, '_blank');
                    } else {
                        // 无新版本时恢复按钮状态
                        checkUpdateBtn.textContent = '检查更新';
                        checkUpdateBtn.disabled = false;
                        checkUpdateBtn.style.backgroundColor = '#007bff';
                        updateStatus.textContent = '已是最新版本';
                    }
                } catch (error) {
                    // 发生错误时恢复按钮状态
                    checkUpdateBtn.textContent = '检查更新';
                    checkUpdateBtn.disabled = false;
                    checkUpdateBtn.style.backgroundColor = '#007bff';
                    updateStatus.textContent = '检查失败';
                }
            }

            // 绑定检查更新事件
            checkUpdateBtn.addEventListener('click', handleUpdateCheck);

            // 统一处理标签点击的函数
            function handleSectionClick(clickedSection, targetSettings) {
    // 如果目标面板已经显示则返回
    if (!document.getElementById(targetSettings).classList.contains('hidden')) return;
    
    // 隐藏所有设置面板
    document.querySelectorAll('[id$="Settings"]').forEach(el => el.classList.add('hidden'));
    
    // 显示目标设置面板
    document.getElementById(targetSettings).classList.remove('hidden');
    
    // 更新标签高亮状态
    document.querySelectorAll('.section').forEach(section => 
        section.classList.remove('active')
    );
    document.getElementById(clickedSection).classList.add('active');
}

// 绑定事件时统一调用方式
document.getElementById('taskSection').addEventListener('click', () => 
    handleSectionClick('taskSection', 'taskSettings')
);

document.getElementById('customSection').addEventListener('click', () => 
    handleSectionClick('customSection', 'customSettings')
);

document.getElementById('aboutSection').addEventListener('click', () => 
    handleSectionClick('aboutSection', 'aboutSettings')
);
},

    preConfirm: () => {
        settings.autoReceive = document.querySelector('input[name="autoReceive"]').checked; // 获取领取奖励状态
        settings.autoSignIn = document.querySelector('input[name="autoSignIn"]').checked; // 获取签到状态
        settings.autoLoadComments = document.querySelector('input[name="autoLoadComments"]').checked; // 获取展开评论状态
        settings.autoExpandReplies = document.querySelector('input[name="autoExpandReplies"]').checked; // 获取展开子回复状态
        settings.autoClickMore = document.querySelector('input[name="autoClickMore"]').checked; // 获取查看更多按钮状态
        settings.messageDoNotDisturb = document.querySelector('input[name="messageDoNotDisturb"]').checked; // 获取免打扰状态
        settings.removeDynamicRedDot = document.querySelector('input[name="removeDynamicRedDot"]').checked; // 获取动态免打扰状态
        settings.removeAvatarFrame = document.querySelector('input[name="removeAvatarFrame"]').checked; // 获取移除头像框状态
        settings.removeMagicReview = document.querySelector('input[name="removeMagicReview"]').checked; // 获取移除魔力测评状态
        settings.taskCenterDoNotDisturb = document.querySelector('input[name="taskCenterDoNotDisturb"]').checked; // 获取任务中心免打扰状态
        settings.adaptiveTextbox = document.querySelector('input[name="adaptiveTextbox"]').checked;// 获取自适应文本框状态
        settings.autoCheckUpdate = document.querySelector('input[name="autoCheckUpdate"]').checked; // 获取自动检查更新状态

        GM_setValue('autoReceive', settings.autoReceive); // 保存领取奖励状态
        GM_setValue('autoSignIn', settings.autoSignIn); // 保存签到状态
        GM_setValue('autoLoadComments', settings.autoLoadComments); // 保存展开评论状态
        GM_setValue('autoExpandReplies', settings.autoExpandReplies); // 保存展开子回复状态
        GM_setValue('autoClickMore', settings.autoClickMore); // 保存查看更多按钮状态
        GM_setValue('messageDoNotDisturb', settings.messageDoNotDisturb); // 保存免打扰状态
        GM_setValue('removeDynamicRedDot', settings.removeDynamicRedDot); // 保存动态免打扰状态
        GM_setValue('removeAvatarFrame', settings.removeAvatarFrame); // 保存移除头像框状态
        GM_setValue('removeMagicReview', settings.removeMagicReview); // 保存移除魔力测评状态
        GM_setValue('taskCenterDoNotDisturb', settings.taskCenterDoNotDisturb); // 保存任务中心免打扰状态
        GM_setValue('adaptiveTextbox', settings.adaptiveTextbox);// 保存自适应文本框状态
        GM_setValue('autoCheckUpdate', settings.autoCheckUpdate); // 保存自动检查更新状态

        return Swal.fire({
            title: '设置已保存',
            text: '更改的设置需刷新后生效，是否刷新？',
            showCancelButton: true,
            confirmButtonText: '刷新',
            cancelButtonText: '取消',
            customClass: {
                confirmButton: 'custom-confirm-button', 
                cancelButton: 'custom-cancel-button' 
            }
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.reload();
            }
        });
    }
});}

// ==更新检查功能==
(function checkUpdate(isManual = false) {
    // 获取当前版本
    const currentVersion = GM_info.script.version;
    //const currentVersion = "1.0.0";//测试用
    
   // 每日检查限制（仅自动检查时生效）
    if (!isManual) {
        const lastCheckDate = GM_getValue('lastUpdateCheck', '');
        const today = new Date().toISOString().split('T')[0];
        
        if (!settings.autoCheckUpdate || today === lastCheckDate) return;
        GM_setValue('lastUpdateCheck', today);
    }

    // 版本比较函数
    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 < p2) return -1;
            if (p1 > p2) return 1;
        }
        return 0;
    }

    // 显示更新弹窗
    function showUpdateAlert(version, url) {
        // 先显示检查结果
        showResult("发现新版本！");

        Swal.fire({
            title: '发现新版本',
            html: `当前版本：v${currentVersion}<br>最新版本：v${version}`,
            icon: 'info',
            showCancelButton: true,
            showConfirmButton: true,
            showCloseButton: true,
            confirmButtonText: '立即更新',
            cancelButtonText: '镜像站更新',
            focusConfirm: false,
            buttonsStyling: true,
            allowOutsideClick: true,  // 允许点击外部关闭
            allowEscapeKey: true,     // 允许ESC关闭
            customClass: {
                closeButton: 'swal2-close'
            },
            didOpen: () => {
                // 获取按钮元素
                const confirmBtn = Swal.getConfirmButton()
                const cancelBtn = Swal.getCancelButton()

                // 覆盖确认按钮点击事件
                confirmBtn.onclick = (e) => {
                    e.preventDefault()
                    window.open(url, '_blank')
                    Swal.enableButtons() // 保持按钮可点击状态
                }

                // 覆盖取消按钮点击事件
                cancelBtn.onclick = (e) => {
                    e.preventDefault()
                    window.open('https://bgithub.xyz/RSPqfgn/XMWplus/releases', '_blank')
                    Swal.enableButtons()
                }
            }
        }).then((result) => {
            // 仅处理关闭按钮的关闭操作
            if (result.dismiss === Swal.DismissReason.close) {
                Swal.close()
            }
        });
    }

    // 主检查逻辑
    async function performCheck() {
        try {
            showLoading();
            
            let latestVersion = null;

            // 尝试主站检查
            const mainResult = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: "https://api.github.com/repos/RSPqfgn/XMWplus/releases/latest",
                    timeout: 5000,
                    onload: resolve,
                    onerror: reject,
                    ontimeout: reject
                });
            });

            try {
                const data = JSON.parse(mainResult.responseText);
                latestVersion = data.tag_name.replace(/^v/, '');
            } catch {
                // 主站失败尝试镜像站
                const mirrorResult = await new Promise(resolve => {
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: "https://bgithub.xyz/RSPqfgn/XMWplus/releases",
                        onload: resolve,
                        timeout: 5000
                    });
                });

                const parser = new DOMParser();
                const doc = parser.parseFromString(mirrorResult.responseText, 'text/html');
                const releaseLink = doc.querySelector('.release-header a[href*="/releases/tag/"]');
                latestVersion = releaseLink?.href.split('/').pop().replace(/^v/, '');
            }

            if (!latestVersion) {
                showResult("检查失败", false);
                return;
            }

            if (compareVersions(currentVersion, latestVersion) < 0) {
                showUpdateAlert(latestVersion);
            } else {
                showResult("已是最新版本");
            }
        } catch (error) {
            showResult("检查失败", false);
            console.error('更新检查失败:', error);
        }
    }

    // 触发检查
    performCheck();
})();
// ==更新检查功能结束==

// 当页面加载完成后开始执行功能
window.onload = function() {
    // 自动领取奖励的代码...
    if (settings.autoReceive) {
        function clickReceive() {
            var receiveButton = document.querySelector("div.taskAction__3nOcF.taskReceiveReward__16CiZ");
            if (receiveButton && receiveButton.textContent === "领取") {
                receiveButton.click();
            }
        }
        // 持续检查领取奖励元素是否存在
        setInterval(function() {
            clickReceive(); // 如果找到元素则执行领取
        }, 1000);
    }

    // 自动签到的代码...
    if (settings.autoSignIn) {
        setTimeout(function() {
            if (window.location.href.includes('/w/index')) {
                var signInButton = document.evaluate("//div [@class='goTaskCenter__h4wru' and text()='签到']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (signInButton) {
                    function clickSignInButton() {
                        if (document.body.textContent.includes("已领取")) {
                            clearInterval(signInInterval);
                        } else {
                            signInButton.click();
                        }
                    }
                    var signInInterval = setInterval(clickSignInButton, 1000);
                }
            }
        }, 1000); // 等待网页加载1秒后执行
    }

    // 自动展开评论的代码...
    if (settings.autoLoadComments) {
        setInterval(function() {
            var moreCommentsButton = document.querySelector('span.iconfont.icon-shequ-xiala.more-comment-icon__2Bxj9');
            if (moreCommentsButton) {
                moreCommentsButton.click();
            }
        }, 1000);
    }

    // 自动展开子回复的代码...
    if (settings.autoExpandReplies) {
        setInterval(function() {
            var replyMoreButton = document.evaluate("//span[contains(@class, 'reply-more-button-text__iB2jQ')]", document, null, XPathResult.ANY_TYPE, null);
            var button = replyMoreButton.iterateNext();
            while (button) {
                button.click();
                button = replyMoreButton.iterateNext();
            }
        }, 1000);
    }

    // 自动点击个人主页中查看更多按钮
    if (settings.autoClickMore) {
        setInterval(function() {
            // 检查是否存在 "查看更多" 按钮
            var seeMoreButton = document.querySelector('.seeMore__1QtpQ');
            if (seeMoreButton && seeMoreButton.textContent.trim() === "查看更多") {
                seeMoreButton.click(); // 点击按钮
            }
        }, 1000);
    }

    // 消息免打扰功能
    if (settings.messageDoNotDisturb) {
        setInterval(function() {
            var messageCountElement = document.querySelector('.message-count__2M-on');
            if (messageCountElement) {
                messageCountElement.style.display = 'none'; // 隐藏消息计数元素
            }
        }, 1000);
    }

    // 动态免打扰功能
    if (settings.removeDynamicRedDot) {
        setInterval(function() {
            var dynamicRedDotElement = document.querySelector('.dynamic-red-dot__3FSaW');
            if (dynamicRedDotElement) {
                dynamicRedDotElement.style.display = 'none'; // 隐藏动态红点元素
            }
        }, 1000);
    }

    // 任务中心免打扰功能
    if (settings.taskCenterDoNotDisturb) {
        setInterval(function() {
            // Xpath定位元素
            const taskCenterBadge = document.evaluate('//*[@id="header"]/div/div/div[1]/div/div/div/ul/li[4]/a/span/sup', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            const otherBadge = document.evaluate('//*[@id="__next"]/div[2]/div[2]/div[2]/div[3]/div[1]/div[2]/span/sup', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            // 隐藏元素
            if (taskCenterBadge) {
                taskCenterBadge.style.display = 'none'; // 隐藏任务中心元素
            }
            if (otherBadge) {
                otherBadge.style.display = 'none'; // 隐藏任务中心元素
            }
        }, 500);
    }

    // 移除头像框功能
    if (settings.removeAvatarFrame) {
        setInterval(function() {
            // 隐藏所有 headDecoration__3FOFH 元素
            var avatarFrameElements = document.querySelectorAll('.headDecoration__3FOFH');
            avatarFrameElements.forEach(function(element) {
                element.style.display = 'none'; // 隐藏头像框元素
            });
            // 隐藏所有 decorationImg__76Jm7 元素
            var decorationImgElements = document.querySelectorAll('.decorationImg__76Jm7');
            decorationImgElements.forEach(function(element) {
                element.style.display = 'none'; // 隐藏头像框元素
            });
        }, 100);
    }

    // 移除魔力测评功能
    if (settings.removeMagicReview) {
        setInterval(function() {
            // 隐藏 outer__3SbsJ 元素
            var outerElement = document.querySelector('.outer__3SbsJ');
            if (outerElement) {
                outerElement.style.display = 'none'; // 隐藏魔力测评元素
            }
        }, 1000);
    }
    if (settings.adaptiveTextbox) {
        // 创建测量元素
        const measurer = document.createElement('span');
        Object.assign(measurer.style, {
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre',
            height: 'auto',
            width: 'auto'
        });

        // 通用调整函数
        function autoAdjust(element) {
            if (element.tagName === 'TEXTAREA') {
                element.style.height = 'auto';
                element.style.height = element.scrollHeight + 'px';
            } else if (element.tagName === 'INPUT' && element.type === 'text') {
                const style = window.getComputedStyle(element);
                measurer.style.font = style.font;
                measurer.style.padding = style.padding;
                measurer.textContent = element.value || element.placeholder;
                
                document.body.appendChild(measurer);
                const minWidth = parseInt(style.minWidth) || 100;
                const newWidth = Math.max(minWidth, measurer.offsetWidth + 20);
                document.body.removeChild(measurer);
                
                element.style.width = newWidth + 'px';
                element.style.transition = 'width 0.2s ease';
            }
        }

        // 事件处理函数
        function handleInput(e) {
            autoAdjust(e.target);
        }

        // 初始化现有文本框
        function initTextboxes() {
            document.querySelectorAll('input[type="text"], textarea').forEach(element => {
                autoAdjust(element);
                element.addEventListener('input', handleInput);
            });
        }

        // 使用MutationObserver监听动态加载的文本框
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const textboxes = node.querySelectorAll?.('input[type="text"], textarea') || [];
                        textboxes.forEach(element => {
                            if (!element.dataset.adaptiveInit) {
                                autoAdjust(element);
                                element.addEventListener('input', handleInput);
                                element.dataset.adaptiveInit = 'true';
                            }
                        });
                    }
                });
            });
        });

        // 开始观察DOM变化
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 初始执行
        initTextboxes();
        
        // 添加重置监听
        window.addEventListener('resize', () => {
            document.querySelectorAll('input[type="text"], textarea').forEach(autoAdjust);
        });
    }

    // 编辑信息功能注入
(function injectEditButton() {
    const targetMenuSelector = 'ul.work-item-copy___StyledUl-jxco1t-5';

    // 创建编辑按钮
    function createEditButton(compositionId) {
    const li = document.createElement('li');
    li.className = 'person-operate-item__aOISu';
    
    const a = document.createElement('a');
    a.name = '编辑信息';
    a.title = '编辑信息（由XMWplus添加）'; // 修改title提示
    a.href = `https://world.xiaomawang.com/w/release/${compositionId}`;
    a.target = '_blank';
    a.textContent = '编辑信息';
    
    // 修改后的悬浮样式
    a.style.cssText = `
        transition: color 0.3s ease;
        cursor: pointer;
        color: #666; /* 默认颜色 */
    `;
    // 修改悬停颜色
    a.addEventListener('mouseover', () => a.style.color = '#ffa31a');
    a.addEventListener('mouseout', () => a.style.color = '#666');
    
    li.appendChild(a);
    return li;
}

    // 提取作品ID
    function extractCompositionId(link) {
        // 解码URL中的HTML实体（如&amp;）
        const decodedLink = decodeURIComponent(link);
        
        // 增强正则表达式以匹配字母数字组合ID
        const match = decodedLink.match(/compositionId=([a-zA-Z0-9]+)/);
        
        return match ? match[1] : null;
    }

    // 注入按钮
    function tryInject() {
        document.querySelectorAll(targetMenuSelector).forEach(menu => {
            // 检查是否已经注入过
            if (menu.querySelector('a[name="编辑信息"]')) return;

            // 查找继续创作按钮
            const createLink = menu.querySelector('a[name="继续创作"]');
            if (!createLink) return;

            // 提取作品ID
            const compositionId = extractCompositionId(createLink.href);
            if (!compositionId) return;

            // 创建并插入按钮
            const editButton = createEditButton(compositionId);
            createLink.parentElement.insertAdjacentElement('afterend', editButton);

            // 保持菜单项间距一致
            menu.style.gap = '8px';
        });
    }

    // 使用MutationObserver监听动态加载
    const observer = new MutationObserver(mutations => {
        mutations.forEach(() => tryInject());
    });

    // 初始注入
    tryInject();
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

};

})();