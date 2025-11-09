# LoopPlayback

macOSで動画や画像を選択し、指定時間までループ再生／常時表示するElectronアプリです。YouTubeを意識した半透明のUIを採用し、フルスクリーン時には「Escで全画面終了」のトーストも表示されます。

## 主な機能
- 直前に利用したメディアを記憶し、次回起動時にワンクリックで再生できます。
- 新しい動画・画像の選択ダイアログを表示。
- 時間・分で再生タイマーを設定可能（未設定の場合は3時間で自動終了）。
- 動画は無限ループ、画像は指定時間まで常時表示。
- 再生中は以下のUIを提供:
  - 右上: マウスホバーで音量コントロール（動画の場合のみ）。
  - 左下: 現在時刻 / 経過時間 / 残り時間を切り替え可能な時計。
  - 右下: 全画面切り替え、停止、再生・一時停止。
  - 全画面化時に「Escで全画面終了」を2秒表示。
- タイマー終了でメディア選択画面へ戻ります。

## 開発環境
- Node.js 18 以上を推奨
- macOS Sonoma (Tahoe) で動作確認を想定

## セットアップ
```bash
npm install
```

> **Note:** このリポジトリではCI環境の制約により`npm install`を実行していません。ローカル環境で依存関係を取得してください。

開発時は以下でElectronを起動します。

```bash
npm run dev
```

## .app 形式へのビルド
1. Xcode Command Line Tools がインストールされていることを確認します。
2. 署名が不要な検証用ビルドで良ければ、以下を実行します。
   ```bash
   npm run build
   ```
   - `release/mac/LoopPlayback.app` ディレクトリが生成され、macOSアプリとして起動できます。
3. 配布用にZIP化・ディスクイメージを作成したい場合は以下を使用します。
   ```bash
   npm run package
   ```
   - `release/` フォルダに `.app` と `.dmg` (もしくは `.zip`) が生成されます。

> アプリに署名／公証を施す場合は `electron-builder` の [mac](https://www.electron.build/configuration/mac) セクションにApple Developerの資格情報を追加してください。

## ディレクトリ構成
```
.
├── package.json
├── src
│   ├── main        # Electron メインプロセス
│   ├── preload     # Renderer へ公開するAPI
│   └── renderer    # UI (HTML/CSS/JS)
└── README.md
```

## ライセンス
MIT
