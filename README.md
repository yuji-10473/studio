# Firebase Studio

This is a NextJS starter in Firebase Studio.

## オリジナルキャラクターのアイコンについて

オリジナルのキャラクターアイコンを追加するには、以下の2つの手順が必要です。

1.  **画像を配置する**:
    画像ファイル（例: `my-icon.png`）を `/public/images/icons/` ディレクトリに配置します。

2.  **設定ファイルを更新する**:
    `src/lib/placeholder-images.json` ファイルを開き、`selectableIcons` のリストに新しいアイコンの情報を追記します。`id` はユニークなもの、`path` は `/images/icons/` から始まる画像のパスを記述してください。

    ```json
    "selectableIcons": [
      // ... 既存のアイコン ...
      { "id": "my-icon", "path": "/images/icons/my-icon.png" }
    ]
    ```

この手順により、新しいアイコンがキャラクター作成画面で選択できるようになります。

Version. 0.9.7
