-- ページ単位Queue処理用テーブル
CREATE TABLE pdf_page_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES pdf_jobs(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    pdf_page_path TEXT, -- 一時的なPDFページ画像パス
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, page_number)
);

-- インデックス作成（Queue処理の高速化）
CREATE INDEX idx_pdf_page_queue_status ON pdf_page_queue(status);
CREATE INDEX idx_pdf_page_queue_job_id ON pdf_page_queue(job_id);
CREATE INDEX idx_pdf_page_queue_created_at ON pdf_page_queue(created_at);

-- 更新日時自動更新のトリガー
CREATE TRIGGER update_pdf_page_queue_updated_at BEFORE UPDATE ON pdf_page_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 設定
ALTER TABLE pdf_page_queue ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のジョブのQueueのみアクセス可能
CREATE POLICY "Users can view own queue" ON pdf_page_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = pdf_page_queue.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own queue" ON pdf_page_queue
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = pdf_page_queue.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own queue" ON pdf_page_queue
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = pdf_page_queue.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );

-- Queue処理用のビュー（pendingページの取得を高速化）
CREATE VIEW pending_pages_queue AS
SELECT 
    pq.id,
    pq.job_id,
    pq.page_number,
    pq.pdf_page_path,
    pq.created_at,
    pj.file_name,
    pj.user_id
FROM pdf_page_queue pq
JOIN pdf_jobs pj ON pq.job_id = pj.id
WHERE pq.status = 'pending'
ORDER BY pq.created_at ASC;

-- ジョブ進捗確認用のビュー
CREATE VIEW job_progress_view AS
SELECT 
    pj.id as job_id,
    pj.file_name,
    pj.total_pages,
    pj.completed_pages,
    pj.status as job_status,
    COUNT(pq.id) as total_queue_items,
    COUNT(CASE WHEN pq.status = 'completed' THEN 1 END) as completed_queue_items,
    COUNT(CASE WHEN pq.status = 'error' THEN 1 END) as error_queue_items,
    COUNT(CASE WHEN pq.status = 'processing' THEN 1 END) as processing_queue_items,
    ROUND(
        (COUNT(CASE WHEN pq.status = 'completed' THEN 1 END)::NUMERIC / 
         NULLIF(COUNT(pq.id), 0)) * 100, 2
    ) as progress_percentage
FROM pdf_jobs pj
LEFT JOIN pdf_page_queue pq ON pj.id = pq.job_id
GROUP BY pj.id, pj.file_name, pj.total_pages, pj.completed_pages, pj.status;
