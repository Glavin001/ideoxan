define([ // Yes, I know Jvakut, an error is thrown but it works. Don't mess with it.
    'jquery',
    'TabManager/Tab',
    'TabManager/TabManager',
    'TabManager/tabElement',
    'prism',
    'beautify/beautify',
    'beautify/beautify-css',
    'beautify/beautify-html'
], ($, Tab, TabManager, tabElement, prism, beautifyJS, beautifyCSS, beautifyHTML) => {
    /* ---------------------------------------- Class/ID Vars --------------------------------------- */
    //Preload
    const preload = document.getElementById('preload')
    // Top CBar
    const cbarTitle = document.getElementById('top-cbar-title')
    // Statusbar
    const statusBarPos = document.getElementById('statusbar-pos')
    const statusBarLang = document.getElementById('statusbar-lang')
    //Viewport
    const viewport = document.getElementById('viewport')
    const viewportIFrame = document.getElementById('viewport-iframe-content')
    //Console
    const terminal = document.getElementById('terminal')
    //Status
    const connectedIcon = document.getElementById('connected-icon')
    const connectedStatus = document.getElementById('connected-status')
    //Lesson Guide
    const lgTitle = document.getElementById('lesson-guide-title')
    const lgNum = document.getElementById('lesson-guide-number')
    const lgChpt = document.getElementById('lesson-guide-chapter')
    const lgback = document.getElementById('button-lesson-back')
    const lgnext = document.getElementById('button-lesson-next')

    window.dragging = false
    /* ------------------------------------------- Preload ------------------------------------------ */
    setTimeout(() => {
        setInterval(() => {
            if (document.readyState == 'complete') {
                preload.style.animation = "preloadFadeOut 1.5s ease-in-out"
                setTimeout(() => {
                    preload.style.opacity = 0
                    preload.remove()
                }, 1500);
            }
        }, 500);
    }, 7500);

    window.onerror = async (msg, url, lineNum, columnNum, err) => {
        if (err) {
            $('body').append(`<div class="toast toast-error">Error. See Console for Details</div>`)
            document.getElementsByClassName('toast')[0].style.animation = "toastIn 1200ms ease-in-out"
            document.getElementsByClassName('toast')[0].style.top = "90vh"
            document.getElementsByClassName('toast')[0].style.opacity = "1"
            setTimeout(() => {
                document.getElementsByClassName('toast')[0].style.animation = "toastOut 1200ms ease-in-out"
                document.getElementsByClassName('toast')[0].style.top = "120vh"
                document.getElementsByClassName('toast')[0].style.opacity = "0"
                // window.location.reload()
            }, 6000);
        }
    }

    $(document).ready(async () => {
        /* ---------------------------------------------------------------------------------------------- */
        /*                                 IDEOXAN INTEGRATED CODE EDITOR                                 */
        /* ---------------------------------------------------------------------------------------------- */
        let editor = ace.edit("code-editor-container") // Creates Ace Editor

        /* -------------------------------------- Lesson Data Setup ------------------------------------- */
        const chapterNum = Number.parseInt(chapter)
        const lessonNum = Number.parseInt(lesson)

        document.title = meta.name + ' | Ideoxan Editor'

        cbarTitle.innerHTML = meta.name // Sets the CBar title to the course title

        lgTitle.innerHTML = meta.chapters[chapterNum].lessons[lessonNum].name //Sets the Lesson Guide header to the lesson name
        lgChpt.innerHTML = meta.chapters[chapterNum].name // Sets the Lesson guide subtitle to the chapter name
        lgNum.innerHTML = `Lesson ${lessonNum + 1}` // Sets the lesson guide subtitle to the lesson number

        if (lessonNum > 0) {
            lgback.children[0].href = '/editor/' + course + '/' + chapter + '/' + subtractThreePlaceFormat(lesson, 1)
            lgback.children[0].innerHTML = '<p class="subheading"><span class="mdi mdi-chevron-left ico-18px ico-dark"></span>Previous Lesson</p>'
        } else {
            if (chapterNum > 0) {
                lgback.children[0].href = '/editor/' + course + '/' + subtractThreePlaceFormat(chapter, 1) + '/' + toThreePlaceFormat(meta.chapters[chapterNum - 1].lessons[meta.chapters[chapterNum - 1].lessons.length - 1])
                lgback.children[0].innerHTML = '<p class="subheading"><span class="mdi mdi-chevron-left ico-18px ico-dark"></span>Previous Chapter</p>'
            } else {
                lgback.children[0].href = '/catalogue'
                lgback.children[0].innerHTML = '<p class="subheading"><span class="mdi mdi-chevron-left ico-18px ico-dark"></span>Catalogue</p>'
            }
        }

        lgnext.children[0].href = '#'
        if (lessonNum < meta.chapters[chapterNum].lessons.length - 1) {
            lgnext.children[0].innerHTML = '<p class="subheading">Next Lesson <span class="mdi mdi-chevron-right ico-18px ico-white"></span></p>'
        } else {
            if (chapterNum < meta.chapters.length - 1) {
                lgnext.children[0].innerHTML = '<p class="subheading">Next Chapter <span class="mdi mdi-chevron-right ico-18px ico-white"></span></p>'
            } else {
            lgnext.children[0].innerHTML = '<p class="subheading">Finish <span class="mdi mdi-chevron-right ico-18px ico-white"></span></p>'
            }
        }

        /* ----------------------------------------- Completion ----------------------------------------- */
        let completionFiles = []
        let numCompletedTasks = 0
        for (let i = 0; i < meta.chapters[chapterNum].lessons[lessonNum].arbitraryFiles.length; i++) {
            window.fetch(`/static/curriculum/curriculum-${course}/content/chapter-${chapter}/${lesson}/comparatives/${meta.chapters[chapterNum].lessons[lessonNum].arbitraryFiles[i]}`, {
                mode: 'no-cors'
            })
            .then(res => res.text())
            .then(text => completionFiles.push(text))
        }

        /* -------------------------------------------- Tabs -------------------------------------------- */
        let codeTabs = new TabManager() // Creates a new TabManger instance to manage the tabs pertaining to the code editor
        for (let i = 0; i < meta.chapters[chapterNum].lessons[lessonNum].arbitraryFiles.length; i++) {
            const arbitraryFile = meta.chapters[chapterNum].lessons[lessonNum].arbitraryFiles[i] // Gets the arbitrary file name
            let starterContent

            if (meta.chapters[chapterNum].lessons[lessonNum].starterFiles.includes(arbitraryFile)) { // Checks to see if the file is a starter file
                starterContent = await window.fetch(`/static/curriculum/curriculum-${course}/content/chapter-${chapter}/${lesson}/starter/${arbitraryFile}`, {
                    mode: 'no-cors'
                }).then(starter => starter.text()) // Sets contents to text
            } else {
                starterContent = '' // Contents don't exist, moving on...
            }

            codeTabs.addTab(new Tab(arbitraryFile, 'code-editor-tabs-container', 'editor-tabs-t-' + i))
            codeTabs.getSession(i).setValue(starterContent)
        }
        codeTabs.setActive(0)
        editor.setSession(codeTabs.getSession(0))

        let rightTabs = new TabManager()
        rightTabs.addTab(new Tab('Viewport', 'right-tabs-container', 'right-tabs-t-0', 'monitor'))
        rightTabs.addTab(new Tab('Terminal', 'right-tabs-container', 'right-tabs-t-1', 'console'))
        rightTabs.setActive(0)
        terminal.hidden = true
        viewport.hidden = false

        /* ------------------------------------------- Config ------------------------------------------- */
        editor.setTheme("ace/theme/monokai") // sets the theme (MUST LINK IN HTML AS WELL)
        editor.setShowPrintMargin(false);

        /* ------------------------------------------- Status ------------------------------------------- */
        displayConnectionStatus()
        // TODO: Use keepalive connection to monitor (bc more stability) 
        window.addEventListener('offline', displayConnectionStatus)
        window.addEventListener('online', displayConnectionStatus)

        updateViewport('website')
        updateStatusBar()
        checkCompletion()
        if (auth) {
            let progress = await getProgress()
            if (progress != null) {
                for (let i = 0; i < meta.chapters[chapterNum].lessons[lessonNum].arbitraryFiles.length; i++) {
                    if (typeof progress[i] != 'undefined') codeTabs.getSession(i).setValue(progress[i])
                }
            }
        }

        /* ---------------------------------------------------------------------------------------------- */
        /*                                         EVENT LISTENER                                         */
        /* ---------------------------------------------------------------------------------------------- */

        /* ------------------------------------------- Editor ------------------------------------------- */
        let updateInterval = 1500
        let updateProcess = async () => {
            updateStatusBar()
            updateViewport('website')
            checkCompletion()
            if (auth) {
                saveProgress()
            }
        }
        let viewportUpdateTimer = window.setTimeout(updateProcess, updateInterval)

        editor.on('change', e => {
            window.clearTimeout(viewportUpdateTimer)
            viewportUpdateTimer = window.setTimeout(updateProcess, updateInterval)
        })

        editor.on('changeSession', e => {
            updateStatusBar()
            editor.session.setUseSoftTabs(true)
            editor.session.$worker.send('changeOptions', [{ asi: true }]) // Gets rid of semicolons error in JS
            editor.session.setUseWrapMode(true);
            editor.session.setNewLineMode('windows')
        })

        let terminalCount = 0
        viewportIFrame.addEventListener('load', () => {
            viewportIFrame.contentWindow.console.addEventListener('log', value => {
                addToTerminal(value)
            })
            viewportIFrame.contentWindow.console.addEventListener('error', value => {
                addToTerminal(value).classList.add('terminal-out-error')
            })
            viewportIFrame.contentWindow.console.addEventListener('warn', value => {
                addToTerminal(value).classList.add('terminal-out-warn')
            })
            viewportIFrame.contentWindow.console.addEventListener('info', value => {
                addToTerminal(value)
            })
            viewportIFrame.contentWindow.onerror = async (msg, url, lineNum, columnNum, err) => {
                addToTerminal(err).classList.add('terminal-out-error')
            }
        })


        /* -------------------------------------------- Tabs -------------------------------------------- */
        // Code
        for (let i = 0; i < codeTabs.length; i++) {
            codeTabs.getTab(i).onClick(evt => {
                evt.preventDefault()
                codeTabs.setActive(i)
                editor.setSession(codeTabs.getSession(i))
            })
        }

        for (let i = 0; i < rightTabs.length; i++) {
            rightTabs.getTab(i).onClick(evt => {
                evt.preventDefault()
                rightTabs.setActive(i)
                if (i == 0) {
                    terminal.hidden = true
                    viewport.hidden = false
                } else {
                    terminal.hidden = false
                    viewport.hidden = true
                }
                updateStatusBar()
                updateViewport('website')
                checkCompletion()
            })
        }
        /* -------------------------------------------- Drags ------------------------------------------- */
        window.addEventListener('mousemove', e => {
            if (window.dragging) {
                var percentage = (e.pageX / window.innerWidth) * 100;
                if (percentage > 25 && percentage < 70) {
                    document.getElementsByClassName("left")[0].style.width = percentage + "%";
                    document.getElementsByClassName("right")[0].style.width = (100 - percentage) + "%";
                }
            }
        })
        window.addEventListener('mouseup', e => {
            window.dragging = false
            $('#viewport iframe').css('pointer-events', 'auto');
        })
        document.getElementById('editor-resize-drag').addEventListener('mousedown', e => {
            window.dragging = true
            $('#viewport iframe').css('pointer-events', 'none');
        })
        /* ---------------------------------------------------------------------------------------------- */
        /*                                             METHODS                                            */
        /* ---------------------------------------------------------------------------------------------- */

        async function checkConnection() {
            res = await fetch('/ping', { method: 'GET', cache: 'no-store' })
            return res.ok
        }

        async function displayConnectionStatus() {
            if (await checkConnection()) {
                connectedIcon.classList = 'mdi mdi-check ico-12px'
                connectedStatus.innerHTML = 'Connected'
            } else {
                connectedIcon.classList = 'mdi mdi-close ico-12px'
                connectedStatus.innerHTML = 'Disconnected'
            }
        }

        function updateStatusBar() {
            statusBarPos.innerHTML = `Line ${editor.getCursorPosition().row + 1}, Col ${editor.getCursorPosition().column + 1}`
            statusBarLang.innerHTML = handleModeType(editor.session.$mode)
        }

        function checkCompletion() {
            let tasks = meta.chapters[chapterNum].lessons[lessonNum].tasks

            for (let i = 0; i < tasks.length; i++) {
                if (!document.getElementById(`lesson-guide-completion-checkbox-${i}`).classList.contains('completed')) {
                    if (tasks[i].completed) {
                        completeTask(`lesson-guide-completion-checkbox-${i}`)
                    } else {
                        if (tasks[i].comparativeType == 'input' && completionFiles[tasks[i].inputBase]) {
                            let inputValue = codeTabs.getTab(tasks[i].inputBase).getDocument().getValue()
                            let beautifiers = {
                                'html': beautifyHTML.html_beautify,
                                'css': beautifyCSS.css_beautify,
                                'js': beautifyJS.js_beautify,
                            }

                            let ext = codeTabs.getTab(tasks[i].inputBase).ext

                            if (tasks[i].comparativeFunction == 'equals') {
                                // MAKE SURE ALL FILES ARE CRLF FORMATTED FOR EOL OR THIS WON'T WORK!!!!
                                if (beautifiers[ext](inputValue.trim()) == beautifiers[ext](completionFiles[tasks[i].inputBase].trim())) {
                                    completeTask(`lesson-guide-completion-checkbox-${i}`)
                                }
                            }

                        } else if (tasks[i].comparativeType == 'tab') {
                            let tabGroup = tasks[i].tabBase.split(' ')[0]
                            let tabName = tasks[i].tabBase.split(' ')[1]
                            let tab

                            if (tabGroup == 'rightTabs') {
                                tab = rightTabs.getTabByFile(tabName)
                            } else if (tabGroup == 'codeTabs') {
                                tab = codeTabs.getTabByFile(tabName)
                            }
                            if (typeof tab !== 'undefined' && tab.id.classList.contains('editor-tabs-t-active')) completeTask(`lesson-guide-completion-checkbox-${i}`)
                        }
                    }
                }

            }

            if (numCompletedTasks == tasks.length) {
                completeLesson()
                if (lessonNum < meta.chapters[chapterNum].lessons.length - 1) {
                    lgnext.children[0].href = '/editor/' + course + '/' + chapter + '/' + addThreePlaceFormat(lesson, 1)
                } else {
                    if (chapterNum < meta.chapters.length - 1) {
                        lgnext.children[0].href = '/editor/' + course + '/' + addThreePlaceFormat(chapter, 1) + '/000'
                    } else {
                        lgnext.children[0].href = '/finish/' + course
                    }
                }
            }
        }

        function completeTask(id) {
            document.getElementById(id).classList.add('completed')
            document.getElementById(id).classList.remove('not-completed')
            document.getElementById(id).classList.remove('mdi-checkbox-blank-outline')
            document.getElementById(id).classList.add('mdi-checkbox-marked')
            numCompletedTasks++
        }

        function addToTerminal(value) {
            document.getElementById('terminal-container').insertAdjacentHTML('beforeend', `<p class="terminal-out" id="terminal-out-${terminalCount}"><span class="terminal-out-time info">${new Date().toISOString()}</span> [CONSOLE] ${value}</p>`)
            terminalCount++
            return document.getElementById(`terminal-out-${terminalCount - 1}`)
        }

        function toThreePlaceFormat(s) {
            return (Number.parseInt(s)).toString().padStart(3, '0')
        }

        function subtractThreePlaceFormat(s, n) {
            return (Number.parseInt(s) - n).toString().padStart(3, '0')
        }

        function addThreePlaceFormat(s, n) {
            return (Number.parseInt(s) + n).toString().padStart(3, '0')
        }

        function saveProgress() {
            let docArray = []
            for (let i = 0; i < meta.chapters[chapterNum].lessons[lessonNum].arbitraryFiles.length; i++) {
                docArray.push(codeTabs.getTab(i).getDocument().getValue())
            }
            window.fetch(`/api/v1/save/editor/${course}/${chapter}/${lesson}`, {
                method: 'POST',
                mode: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                cache: 'no-cache',
                body: JSON.stringify({documentArray: docArray})
            })
        }

        async function getProgress() {
            let res = await window.fetch(`/api/v1/save/editor/${course}/${chapter}/${lesson}`, {
                method: 'GET',
                mode: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                cache: 'no-cache'
            })
            
            if (res.status == 204 || res.status == 404 || res.status == 500 || res.body == '') {
                return null
            }
            let body = await res.json()

            return body.documentArray
        }

        function completeLesson() {
            window.fetch(`/api/v1/complete/${course}/${chapter}/${lesson}`, {
                method: 'POST',
                mode: 'same-origin',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin',
                cache: 'no-cache'
            })
        }

        function updateViewport(type) {
            switch (type) {
                case 'website':

                    // TODO: (PRIORITY) This is only a temporary fix for the iframe. This is VERY insecure and should be worked on immediately. This is a replacement for the WebVM environment. Please work on the WebVM before this is exploited
                    let htmlStr = codeTabs.getDocument(0).getValue().trim()

                    if (!htmlStr.includes('<head>') || !htmlStr.includes('</head>')
                        || !htmlStr.includes('<body>') || !htmlStr.includes('</body>'))
                        return viewportIFrame.srcdoc = htmlStr


                    let htmlHead = htmlStr.split('<head>').pop().split('</head>')[0].trim().split('\n')
                    for (let i = 0; i < htmlHead.length; i++) {
                        htmlHead[i] = htmlHead[i].trim()

                        if (htmlHead[i].startsWith('<link')) {
                            let refStr = 'href="'
                            let refStrPos = htmlHead[i].indexOf(refStr)

                            let href = htmlHead[i].substring(refStrPos + refStr.length, htmlHead[i].indexOf('"', refStrPos + refStr.length))

                            let style = codeTabs.getTabByFile(href)
                            if (style != undefined) {
                                htmlHead[i] = `<style> ${style.getDocument().getValue()} </style>`
                            }
                        }
                    }
                    htmlHead = htmlHead.join('\n')

                    let htmlBody = htmlStr.split('<body>').pop().split('</body>')[0].trim().split('\n')
                    for (let i = 0; i < htmlBody.length; i++) {
                        htmlBody[i] = htmlBody[i].trim()

                        if (htmlBody[i].startsWith('<script')) {
                            let refStr = 'src="'
                            let refStrPos = htmlBody[i].indexOf(refStr)

                            let src = htmlBody[i].substring(refStrPos + refStr.length, htmlBody[i].indexOf('"', refStrPos + refStr.length))

                            let style = codeTabs.getTabByFile(src)
                            if (style != undefined) {
                                htmlBody[i] = `<script> ${style.getDocument().getValue()} </script>`
                            }
                        }
                    }
                    htmlBody = htmlBody.join('\n')

                    viewportIFrame.srcdoc = `<!DOCTYPE html>
                        <html>
                            <head>
                                <script>
                                    console.__on = {}
                                    console.addEventListener = (name, cb) => {
                                        console.__on[name] = (console.__on[name] || []).concat(cb)
                                        return console
                                    }
                                    console.dispatchEvent = (name, value) => {
                                        console.__on[name] = (console.__on[name] || [])
                                        for (let i = 0; i < console.__on[name].length; i++) {
                                            console.__on[name][i].call(console, value)
                                        }
                                        return console
                                    }
                                    console.log = (...args) => {
                                        let argsArray = []
                                        for (let i = 0; i < args.length; i++) {
                                            argsArray.push(args[i])
                                        }
                                        console.dispatchEvent('log', argsArray)
                                    }
                                    console.error = (...args) => {
                                        let argsArray = []
                                        for (let i = 0; i < args.length; i++) {
                                            argsArray.push(args[i])
                                        }
                                        console.dispatchEvent('error', argsArray)
                                    }
                                    console.warn = (...args) => {
                                        let argsArray = []
                                        for (let i = 0; i < args.length; i++) {
                                            argsArray.push(args[i])
                                        }
                                        console.dispatchEvent('warn', argsArray)
                                    }
                                    console.info = (...args) => {
                                        let argsArray = []
                                        for (let i = 0; i < args.length; i++) {
                                            argsArray.push(args[i])
                                        }
                                        console.dispatchEvent('info', argsArray)
                                    }
                                </script>
                                ${htmlHead}
                            </head>
                            <body>
                                ${htmlBody}
                            </body>
                        </html>`

                    break
            }
        }
    })

})

