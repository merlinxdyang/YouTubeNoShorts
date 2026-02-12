# YouTubeNoShorts

**[中文](#中文) | [English](#english) | [日本語](#日本語) | [한국어](#한국어)**

---

<a id="中文"></a>

## 🇨🇳 中文

如果你也跟我一样讨厌 YouTube 的短视频（Shorts），那么这个插件就是为你准备的。安装之后，它会彻底屏蔽 YouTube 里所有跟 Shorts 有关的内容——首页推荐、搜索结果、侧边栏入口、频道页标签……全部干掉，还你一个干净清爽的 YouTube。

本插件采用 **5 层屏蔽架构**，从路由、网络、界面、点击到数据请求层层拦截，让 Shorts 无处藏身。同时兼容 **Chrome** 和 **Microsoft Edge** 两大浏览器，安装包通用，无需任何修改。

### ✨ 功能特性

| 屏蔽层 | 方式 | 效果 |
|--------|------|------|
| 🔀 路由重定向 | 拦截 URL | `/shorts/*` → 首页，`/@频道/shorts` → 频道主页 |
| 🌐 网络拦截 | declarativeNetRequest | 7 条规则屏蔽 Shorts API（reel / shorts / FEshorts） |
| 🎨 界面隐藏 | CSS 注入 | 基于 `overlay-style="SHORTS"` + `:has()` 选择器 |
| 🖱️ 点击拦截 | 事件监听 | 左键 / 中键 / 右键 + `window.open` 全部拦截 |
| 📡 数据拦截 | Fetch 钩子 | 拦截 `fetch()` 请求，返回空数据 |

### 📦 安装方法

#### Chrome
1. 打开 `chrome://extensions`
2. 开启右上角的 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `YouTubeNoShorts` 文件夹

#### Edge
1. 打开 `edge://extensions`
2. 开启左侧的 **开发人员模式**
3. 点击 **加载解压缩**
4. 选择同一个 `YouTubeNoShorts` 文件夹

### ✅ 验证效果

- 访问 `https://www.youtube.com/shorts/任意ID` → 自动跳转首页
- YouTube 首页看不到任何 Shorts 卡片
- 左侧导航栏没有「Shorts」入口
- 搜索结果中没有 Shorts 视频
- 频道页没有「Shorts」标签

---

<a id="english"></a>

## 🇬🇧 English

Sick of YouTube Shorts clogging up your feed? Same here. Install this extension and every last trace of Shorts disappears — homepage recommendations, search results, sidebar links, channel tabs… all gone. Just pure, clean YouTube the way it should be.

This extension uses a **5-layer blocking architecture** that intercepts Shorts at every level: routing, network, UI, clicks, and data requests. Works on both **Chrome** and **Microsoft Edge** with the same installation package — no modifications needed.

### ✨ Features

| Layer | Method | What it blocks |
|-------|--------|----------------|
| 🔀 Route redirect | URL interception | `/shorts/*` → Home, `/@channel/shorts` → Channel home |
| 🌐 Network blocking | declarativeNetRequest | 7 rules blocking Shorts APIs (reel / shorts / FEshorts) |
| 🎨 UI hiding | CSS injection | `overlay-style="SHORTS"` + `:has()` selectors |
| 🖱️ Click interception | Event listeners | Left / middle / right click + `window.open` hijack |
| 📡 Data interception | Fetch hook | Intercepts `fetch()` calls, returns empty responses |

### 📦 Installation

#### Chrome
1. Open `chrome://extensions`
2. Toggle on **Developer mode**
3. Click **Load unpacked**
4. Select the `YouTubeNoShorts` folder

#### Edge
1. Open `edge://extensions`
2. Toggle on **Developer mode**
3. Click **Load unpacked**
4. Select the same `YouTubeNoShorts` folder

### ✅ Verify

- Visit `https://www.youtube.com/shorts/anyID` → auto-redirects to home
- No Shorts cards on the YouTube homepage
- No "Shorts" entry in the sidebar
- No Shorts in search results
- No "Shorts" tab on channel pages

---

<a id="日本語"></a>

## 🇯🇵 日本語

YouTube のショート動画にうんざりしていませんか？ この拡張機能をインストールすれば、YouTube 上のすべてのショート関連コンテンツが完全にブロックされます — ホームのおすすめ、検索結果、サイドバー、チャンネルページのタブ……すべて消えて、すっきりした YouTube に戻ります。

**5 層ブロッキングアーキテクチャ**を採用し、ルーティング、ネットワーク、UI、クリック、データリクエストのすべての層でショートを遮断します。**Chrome** と **Microsoft Edge** の両方に対応し、同じパッケージでインストールできます。

### ✨ 機能

| レイヤー | 方式 | ブロック対象 |
|----------|------|------------|
| 🔀 ルートリダイレクト | URL インターセプト | `/shorts/*` → ホーム、`/@チャンネル/shorts` → チャンネルホーム |
| 🌐 ネットワークブロック | declarativeNetRequest | 7 つのルールで Shorts API を遮断 |
| 🎨 UI 非表示 | CSS インジェクション | `overlay-style="SHORTS"` + `:has()` セレクター |
| 🖱️ クリック遮断 | イベントリスナー | 左 / 中 / 右クリック + `window.open` フック |
| 📡 データ遮断 | Fetch フック | `fetch()` をインターセプトし、空レスポンスを返却 |

### 📦 インストール方法

#### Chrome
1. `chrome://extensions` を開く
2. **デベロッパーモード** をオンにする
3. **パッケージ化されていない拡張機能を読み込む** をクリック
4. `YouTubeNoShorts` フォルダを選択

#### Edge
1. `edge://extensions` を開く
2. **開発者モード** をオンにする
3. **展開して読み込み** をクリック
4. 同じ `YouTubeNoShorts` フォルダを選択

### ✅ 動作確認

- `https://www.youtube.com/shorts/任意のID` にアクセス → ホームに自動リダイレクト
- YouTube ホームにショートカードが表示されない
- サイドバーに「ショート」が表示されない
- 検索結果にショート動画が表示されない
- チャンネルページに「ショート」タブが表示されない

---

<a id="한국어"></a>

## 🇰🇷 한국어

YouTube 쇼츠가 피드를 어지럽히는 게 지겹지 않으신가요? 이 확장 프로그램을 설치하면 YouTube의 모든 쇼츠 관련 콘텐츠가 완전히 차단됩니다 — 홈 추천, 검색 결과, 사이드바 링크, 채널 페이지 탭……모두 사라지고 깔끔한 YouTube를 되찾을 수 있습니다.

**5계층 차단 아키텍처**를 사용하여 라우팅, 네트워크, UI, 클릭, 데이터 요청의 모든 수준에서 쇼츠를 차단합니다. **Chrome**과 **Microsoft Edge** 모두 동일한 패키지로 설치할 수 있습니다.

### ✨ 기능

| 계층 | 방식 | 차단 대상 |
|------|------|----------|
| 🔀 라우트 리다이렉트 | URL 인터셉트 | `/shorts/*` → 홈, `/@채널/shorts` → 채널 홈 |
| 🌐 네트워크 차단 | declarativeNetRequest | 7개 규칙으로 Shorts API 차단 |
| 🎨 UI 숨기기 | CSS 인젝션 | `overlay-style="SHORTS"` + `:has()` 셀렉터 |
| 🖱️ 클릭 차단 | 이벤트 리스너 | 좌/중/우 클릭 + `window.open` 후킹 |
| 📡 데이터 차단 | Fetch 후킹 | `fetch()` 요청 인터셉트, 빈 응답 반환 |

### 📦 설치 방법

#### Chrome
1. `chrome://extensions` 열기
2. **개발자 모드** 활성화
3. **압축해제된 확장 프로그램을 로드합니다** 클릭
4. `YouTubeNoShorts` 폴더 선택

#### Edge
1. `edge://extensions` 열기
2. **개발자 모드** 활성화
3. **압축 풀린 항목 로드** 클릭
4. 동일한 `YouTubeNoShorts` 폴더 선택

### ✅ 확인 방법

- `https://www.youtube.com/shorts/아무ID` 방문 → 홈으로 자동 리다이렉트
- YouTube 홈에 쇼츠 카드 없음
- 사이드바에 "쇼츠" 항목 없음
- 검색 결과에 쇼츠 영상 없음
- 채널 페이지에 "쇼츠" 탭 없음

---

## License

MIT
