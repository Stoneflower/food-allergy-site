-- PDF処理ジョブ管理テーブル
CREATE TABLE pdf_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    file_size BIGINT,
    total_pages INTEGER DEFAULT 0,
    completed_pages INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDFページ処理結果テーブル
CREATE TABLE pdf_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES pdf_jobs(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    json_data JSONB,
    storage_path TEXT, -- Supabase Storageへのパス
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(job_id, page_number)
);

-- アレルギー情報テーブル（最終結果）
CREATE TABLE allergy_extractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES pdf_jobs(id) ON DELETE CASCADE,
    menu_name TEXT NOT NULL,
    allergies JSONB NOT NULL, -- 28品目のアレルギー情報
    page_number INTEGER,
    cell_position JSONB, -- セルの位置情報
    confidence_score FLOAT, -- OCR信頼度
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_pdf_jobs_status ON pdf_jobs(status);
CREATE INDEX idx_pdf_jobs_user_id ON pdf_jobs(user_id);
CREATE INDEX idx_pdf_jobs_created_at ON pdf_jobs(created_at);
CREATE INDEX idx_pdf_pages_job_id ON pdf_pages(job_id);
CREATE INDEX idx_pdf_pages_status ON pdf_pages(status);
CREATE INDEX idx_allergy_extractions_job_id ON allergy_extractions(job_id);

-- 更新日時自動更新のトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdf_jobs_updated_at BEFORE UPDATE ON pdf_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_pages_updated_at BEFORE UPDATE ON pdf_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 設定
ALTER TABLE pdf_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_extractions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のジョブのみアクセス可能
CREATE POLICY "Users can view own jobs" ON pdf_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON pdf_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON pdf_jobs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own pages" ON pdf_pages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = pdf_pages.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own pages" ON pdf_pages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = pdf_pages.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own extractions" ON allergy_extractions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = allergy_extractions.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own extractions" ON allergy_extractions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pdf_jobs 
            WHERE pdf_jobs.id = allergy_extractions.job_id 
            AND pdf_jobs.user_id = auth.uid()
        )
    );
