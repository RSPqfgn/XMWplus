// ==UserScript==
// @name         小码王Plus
// @version      1.5.0
// @description  使你的小码王更易于使用
// @author       RSPqfgn
// @match        https://world.xiaomawang.com/*
// @icon         https://world.xiaomawang.com/favicon.ico
// @license      MIT
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js
// ==/UserScript==
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
    taskCenterDoNotDisturb: GM_getValue('taskCenterDoNotDisturb', false) // 任务中心免打扰
};

// 注册命令
GM_registerMenuCommand('查询', performQuery);
GM_registerMenuCommand('自动完成任务', autoCompleteTask);
GM_registerMenuCommand('设置', openSettingsDialog);

//查询功能
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

//自动完成任务
function autoCompleteTask() {
    Swal.fire({
        title: '自动完成任务',
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
</style>

<div class="button-container">
    <div id="taskSection" class="section active">自动任务</div> <!-- 默认高亮 -->
    <div id="customSection" class="section">界面定制</div>
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

    // 自动任务按钮点击事件

    document.getElementById('taskSection').addEventListener('click', () => {

        if (!document.getElementById('taskSettings').classList.contains('hidden')) return;

        document.getElementById('taskSettings').classList.remove('hidden');

        document.getElementById('customSettings').classList.add('hidden');

        // 高亮逻辑（删除对 advancedSection 的引用）

        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

        document.getElementById('taskSection').classList.add('active');

    });

    // 界面定制按钮点击事件

    document.getElementById('customSection').addEventListener('click', () => {

        if (!document.getElementById('customSettings').classList.contains('hidden')) return;

        document.getElementById('customSettings').classList.remove('hidden');

        document.getElementById('taskSettings').classList.add('hidden');

        // 高亮逻辑（删除对 advancedSection 的引用）

        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

        document.getElementById('customSection').classList.add('active');

    });

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
(function checkUpdate() {
    // 获取当前版本
    const currentVersion = GM_info.script.version;
    //const currentVersion = '1.0.0';//测试用
    
    // 每日检查限制
    const lastCheckDate = GM_getValue('lastUpdateCheck', '');
    const today = new Date().toISOString().split('T')[0];
    
    // 每天只检查一次
    if (today === lastCheckDate) return;//测试时禁用
    GM_setValue('lastUpdateCheck', today);

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
                window.open('https://kkgithub.com/RSPqfgn/XMWplus/releases', '_blank')
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
    // 尝试主站检查更新
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://api.github.com/repos/RSPqfgn/XMWplus/releases/latest",
        timeout: 5000,
        onload: function(response) {
            try {
                const data = JSON.parse(response.responseText);
                const latestVersion = data.tag_name.replace(/^v/, '');
                
                if (compareVersions(currentVersion, latestVersion) < 0) {
                    showUpdateAlert(latestVersion, data.html_url);
                }
            } catch {
                checkMirrorUpdate();
            }
        },
        onerror: checkMirrorUpdate,
        ontimeout: checkMirrorUpdate
    });

    // 镜像站检查更新（备用方案）
    function checkMirrorUpdate() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://kkgithub.com/RSPqfgn/XMWplus/releases",
            timeout: 5000,
            onload: function(response) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(response.responseText, 'text/html');
                    const releaseLink = doc.querySelector('.release-header a[href*="/releases/tag/"]');
                    
                    if (releaseLink) {
                        const version = releaseLink.href.split('/').pop().replace(/^v/, '');
                        if (compareVersions(currentVersion, version) < 0) {
                            showUpdateAlert(version, 'https://kkgithub.com/RSPqfgn/XMWplus/releases');
                        }
                    }
                } catch (error) {
                    console.log('更新检查失败');
                }
            }
        });
    }
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
};

})();