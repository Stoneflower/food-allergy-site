# Cloudflare Images 統合セットアップガイド

## 概要
このプロジェクトでは、Cloudflare Imagesを使用して画像のアップロード・配信を行います。Supabaseストレージの制限を回避し、高速で安定した画像配信を実現します。

## 必要な環境変数

### Netlify Functions用（サーバーサイド）
以下の環境変数をNetlifyの「Site settings → Environment variables」で設定してください：

```
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_IMAGES_API_TOKEN=your-cloudflare-images-api-token
```

### フロントエンド用（クライアントサイド）
`.env`ファイルまたは環境変数で以下を設定してください：

```
REACT_APP_CF_ACCOUNT_HASH=your-cloudflare-account-hash
```

## Cloudflare設定手順

### 1. Cloudflare Imagesの有効化
1. Cloudflareダッシュボードにログイン
2. 左サイドバーから「Images」を選択
3. 「Get started」をクリックしてImagesを有効化

### 2. APIトークンの発行
1. Cloudflareダッシュボードの右上のプロフィールアイコンをクリック
2. 「My Profile」→「API Tokens」を選択
3. 「Create Token」をクリック
4. 「Custom token」を選択
5. 以下の設定でトークンを作成：
   - **Token name**: `Allergy App Images API`
   - **Permissions**: 
     - `Account:Cloudflare Images:Edit`
   - **Account Resources**: 
     - `Include:All accounts` または特定のアカウントを選択
6. 「Continue to summary」→「Create Token」でトークンを発行
7. 生成されたトークンを `CF_IMAGES_API_TOKEN` として設定

### 3. アカウントIDとアカウントハッシュの取得
1. Cloudflareダッシュボードの右サイドバーで「Account ID」を確認
2. ImagesページのURLまたは配信URLから「Account Hash」を確認
   - 例: `https://imagedelivery.net/abc123def456/...` の `abc123def456` 部分

## データベース設定

### Supabaseテーブル更新
以下のSQLを実行してテーブルに画像関連フィールドを追加してください：

```sql
-- productsテーブルにimage_idフィールドを追加
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_id VARCHAR(100);

-- menu_itemsテーブルにimage_idフィールドを追加
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_id VARCHAR(100);
```

## 使用方法

### 1. 商品管理ページでの画像アップロード
- `/product-management` ページで商品を追加する際に画像をアップロード可能
- アップロードされた画像は自動的に圧縮され、Cloudflare Imagesに保存される
- `image_id`がSupabaseのproductsテーブルに保存される

### 2. 複数画像アップローダー（新機能）
- **高機能版**: ドラッグ&ドロップ、進捗表示、プレビュー機能付き
- **シンプル版**: 基本的な機能のみの軽量版
- 最大3枚までの画像を一括でアップロード可能
- リアルタイムでの圧縮・アップロード進捗表示

### 3. CSV一括アップロードでの画像関連付け
- CSVファイルと画像ファイルを同時にアップロード可能
- 商品名とファイル名が一致する場合、自動的に関連付けられる
- 変換プレビュー画面で画像の関連付け状況を確認可能

### 4. 商品更新モーダルでの証拠画像
- 商品情報更新時に証拠画像をアップロード可能
- 画像はCloudflare Imagesに保存され、更新履歴に記録される

### 5. デモページ
- `/image-upload-demo` で新しい画像アップローダーの動作を確認可能
- 複数のアップローダータイプを比較・テストできる

## 画像配信URLの生成

### 基本的な配信URL
```javascript
import { buildImageUrl } from './src/utils/cloudflareImages';

const imageUrl = buildImageUrl({
  accountHash: 'your-account-hash',
  imageId: 'uploaded-image-id',
  variant: 'w=800,q=75' // 幅800px、品質75%
});
```

### よく使用する変換パラメータ
- **一覧表示用**: `w=400,h=400,q=70`
- **詳細表示用**: `w=800,q=75`
- **サムネイル用**: `w=150,h=150,q=75`
- **高品質表示用**: `w=1200,q=85`

## トラブルシューティング

### よくある問題

1. **画像が表示されない**
   - `REACT_APP_CF_ACCOUNT_HASH`が正しく設定されているか確認
   - `image_id`がSupabaseに正しく保存されているか確認
   - ブラウザの開発者ツールでネットワークエラーを確認

2. **アップロードが失敗する**
   - `CF_ACCOUNT_ID`と`CF_IMAGES_API_TOKEN`が正しく設定されているか確認
   - Netlify Functionsが正しくデプロイされているか確認
   - ファイルサイズが5MB以下であることを確認

3. **画像の圧縮が効かない**
   - `browser-image-compression`ライブラリが正しくインストールされているか確認
   - ブラウザがWeb Workerをサポートしているか確認

### デバッグ方法

1. **ブラウザの開発者ツール**
   - Networkタブでアップロードリクエストを確認
   - Consoleタブでエラーメッセージを確認

2. **Netlify Functions ログ**
   - Netlifyダッシュボードの「Functions」タブでログを確認

3. **Cloudflareダッシュボード**
   - Imagesページでアップロード状況を確認
   - 配信統計を確認

## パフォーマンス最適化

### 推奨設定
- **画像圧縮**: 最大1MB、最大幅1600px
- **並列アップロード**: 同時2件まで
- **キャッシュ**: Cloudflareの自動キャッシュを活用
- **変換パラメータ**: 用途に応じて最適なサイズを設定

### コスト最適化
- 不要な画像は定期的に削除
- 変換パラメータで適切なサイズを指定
- Cloudflareの無料枠を活用（月10,000リクエストまで）

## セキュリティ考慮事項

1. **APIトークンの管理**
   - トークンはNetlifyの環境変数で管理
   - ブラウザに直接露出しないよう注意

2. **画像ファイルの検証**
   - ファイル形式の検証（JPEG, PNG, WebPのみ）
   - ファイルサイズの制限（5MB以下）
   - 悪意のあるファイルの検出

3. **アクセス制御**
   - 必要に応じて画像のアクセス権限を設定
   - 機密画像の取り扱いに注意

## 新機能の詳細

### MultiImageUploader コンポーネント
```javascript
import MultiImageUploader from './components/MultiImageUploader';

<MultiImageUploader
  productId={productId}           // 商品ID（オプション）
  maxImages={3}                   // 最大画像数
  maxSizeMB={0.5}                 // 最大ファイルサイズ
  maxWidthOrHeight={1024}         // 最大画像サイズ
  accountHash={CF_ACCOUNT_HASH}   // Cloudflare Account Hash
  variant="w=800,q=75"           // 配信時の変換パラメータ
  onUploadComplete={(images) => {}} // アップロード完了コールバック
  onError={(error) => {}}        // エラーコールバック
/>
```

### SimpleImageUploader コンポーネント
```javascript
import SimpleImageUploader from './components/SimpleImageUploader';

<SimpleImageUploader productId={productId} />
```

### 主な特徴
- **自動圧縮**: browser-image-compressionによる画像最適化
- **進捗表示**: リアルタイムでの圧縮・アップロード進捗
- **エラーハンドリング**: 詳細なエラーメッセージと復旧機能
- **プレビュー機能**: アップロード前後の画像プレビュー
- **ドラッグ&ドロップ**: 直感的なファイル選択
- **レスポンシブ対応**: モバイル・デスクトップ両対応

## 今後の拡張予定

- [x] 複数画像アップローダーの実装
- [x] 進捗表示機能の追加
- [x] ドラッグ&ドロップ対応
- [ ] 画像の自動リサイズ・最適化
- [ ] 画像のメタデータ管理
- [ ] 画像の一括削除機能
- [ ] 画像の使用状況分析
- [ ] CDNキャッシュの最適化
- [ ] 画像の自動タグ付け機能
- [ ] 画像検索機能
