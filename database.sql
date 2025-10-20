-- database.sql
-- 校园代取快递 - 安全数据库设置
-- 在 Supabase SQL 编辑器中运行这些命令

-- 启用行级安全 (Row Level Security)
ALTER TABLE delivery_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 创建订单表
CREATE TABLE IF NOT EXISTS delivery_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_code TEXT,
    package_weight TEXT,
    package_type TEXT,
    contact_name TEXT NOT NULL,
    contact_method TEXT NOT NULL,
    contact_info TEXT,
    reward DECIMAL(10,2) DEFAULT 5.00,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_by TEXT NOT NULL,
    taken_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建聊天消息表
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES delivery_orders(id),
    sender TEXT NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建安全策略

-- 订单表策略：用户只能查看自己的订单或待接订单
CREATE POLICY "用户查看订单策略" ON delivery_orders
FOR SELECT USING (
    auth.uid()::text = created_by OR 
    auth.uid()::text = taken_by OR
    status = 'pending'
);

-- 用户只能创建自己的订单
CREATE POLICY "用户创建订单策略" ON delivery_orders
FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- 用户只能更新自己的订单
CREATE POLICY "用户更新订单策略" ON delivery_orders
FOR UPDATE USING (
    auth.uid()::text = created_by OR 
    auth.uid()::text = taken_by
);

-- 聊天消息策略：用户只能查看相关订单的聊天
CREATE POLICY "用户查看聊天策略" ON chat_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM delivery_orders 
        WHERE delivery_orders.id = chat_messages.order_id 
        AND (delivery_orders.created_by = auth.uid()::text OR 
             delivery_orders.taken_by = auth.uid()::text)
    )
);

-- 用户只能发送相关订单的聊天
CREATE POLICY "用户发送聊天策略" ON chat_messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM delivery_orders 
        WHERE delivery_orders.id = chat_messages.order_id 
        AND (delivery_orders.created_by = auth.uid()::text OR 
             delivery_orders.taken_by = auth.uid()::text)
    )
);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_orders_updated_at 
    BEFORE UPDATE ON delivery_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();