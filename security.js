// Supabase 配置 - 替换成你的实际密钥
const SUPABASE_URL = 'https://mdkvoofsjmwxwsfoudbz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ka3Zvb2Zzam13eHdzZm91ZGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4ODE2NTgsImV4cCI6MjA3NjQ1NzY1OH0.KXwS4CWYM5RIJ9RzQAVwAn9f1qvDBHykbil0CVykFP8';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 修改保存订单的函数
async function saveOrderToSupabase(order) {
    const { data, error } = await supabase
        .from('delivery_orders')
        .insert([order]);
    
    if (error) {
        console.error('保存失败:', error);
        return false;
    }
    return true;
}
// security.js - 安全功能核心文件
// 作者：校园代取快递安全团队
// 版本：1.0

console.log('🔒 安全系统启动中...');

// ==================== 基础安全配置 ====================
const SECURITY_CONFIG = {
    ENCRYPTION_KEY: 'campus_delivery_2024_secure_key',
    VERSION: '1.0.0'
};

// ==================== 加密功能 ====================
const Security = {
    // 简单加密（适合初学者）
    encrypt: function(text) {
        try {
            // 使用 CryptoJS 进行加密
            if (typeof CryptoJS === 'undefined') {
                console.warn('CryptoJS 未加载，使用简单加密');
                return btoa(unescape(encodeURIComponent(text)));
            }
            return CryptoJS.AES.encrypt(text, SECURITY_CONFIG.ENCRYPTION_KEY).toString();
        } catch (error) {
            console.error('加密失败:', error);
            return text; // 失败时返回原文
        }
    },

    // 解密
    decrypt: function(encryptedText) {
        try {
            if (typeof CryptoJS === 'undefined') {
                return decodeURIComponent(escape(atob(encryptedText)));
            }
            const bytes = CryptoJS.AES.decrypt(encryptedText, SECURITY_CONFIG.ENCRYPTION_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('解密失败:', error);
            return encryptedText;
        }
    },

    // 安全存储数据
    setSecureItem: function(key, value) {
        try {
            const encrypted = this.encrypt(JSON.stringify(value));
            localStorage.setItem(key, encrypted);
            return true;
        } catch (error) {
            console.error('安全存储失败:', error);
            return false;
        }
    },

    // 安全读取数据
    getSecureItem: function(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            
            const decrypted = this.decrypt(encrypted);
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('安全读取失败:', error);
            return null;
        }
    }
};

// ==================== 输入验证 ====================
const InputValidator = {
    // 基础清理
    sanitize: function(input) {
        if (typeof input !== 'string') return '';
        
        // 移除危险标签和脚本
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&#34;')
            .substring(0, 500); // 限制长度
    },

    // 检查危险内容
    hasDangerousContent: function(text) {
        const dangerousPatterns = [
            /<script/i,
            /javascript:/i,
            /onclick/i,
            /onload/i,
            /onerror/i
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(text));
    }
};

// ==================== 威胁检测 ====================
const ThreatDetector = {
    // 检测可疑活动
    checkSuspiciousActivity: function() {
        const recentActions = this.getRecentActions();
        
        // 检查是否有频繁操作
        if (recentActions.length > 10) {
            this.logThreat('高频操作检测', { count: recentActions.length });
            return true;
        }
        
        return false;
    },

    getRecentActions: function() {
        // 从本地存储获取最近操作
        const actions = Security.getSecureItem('user_actions') || [];
        // 只返回最近1小时的操作
        const oneHourAgo = Date.now() - 3600000;
        return actions.filter(action => action.time > oneHourAgo);
    },

    logThreat: function(type, details) {
        const threatLog = {
            type: type,
            details: details,
            time: Date.now(),
            userAgent: navigator.userAgent
        };
        
        // 保存到安全日志
        const logs = Security.getSecureItem('security_logs') || [];
        logs.push(threatLog);
        Security.setSecureItem('security_logs', logs);
        
        // 显示警告
        this.showWarning(type);
    },

    showWarning: function(message) {
        const alertDiv = document.getElementById('security-alert');
        const messageDiv = document.getElementById('security-message');
        
        if (alertDiv && messageDiv) {
            messageDiv.textContent = `安全警告: ${message}`;
            alertDiv.style.display = 'block';
            
            // 5秒后隐藏
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 5000);
        }
    }
};

// ==================== 用户管理 ====================
const UserManager = {
    // 初始化用户
    initUser: function() {
        let user = Security.getSecureItem('currentUser');
        
        if (!user) {
            // 创建新用户
            user = {
                id: 'user_' + Date.now(),
                deviceId: this.generateDeviceId(),
                name: '用户' + Math.random().toString(36).substr(2, 6),
                createdAt: new Date().toISOString(),
                securityLevel: 'high'
            };
            
            Security.setSecureItem('currentUser', user);
            console.log('新用户创建:', user.id);
        }
        
        return user;
    },

    // 生成设备ID
    generateDeviceId: function() {
        let deviceId = localStorage.getItem('userDeviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userDeviceId', deviceId);
        }
        return deviceId;
    },

    // 更新用户信息
    updateUser: function(updates) {
        const user = Security.getSecureItem('currentUser') || {};
        const updatedUser = { ...user, ...updates };
        Security.setSecureItem('currentUser', updatedUser);
        return updatedUser;
    }
};

// ==================== 订单管理 ====================
const OrderManager = {
    // 提交订单（安全版本）
    submitOrder: function(orderData) {
        // 输入验证
        if (!this.validateOrder(orderData)) {
            alert('请填写完整信息');
            return false;
        }
        
        // 威胁检测
        if (ThreatDetector.checkSuspiciousActivity()) {
            alert('检测到可疑活动，请稍后重试');
            return false;
        }
        
        try {
            // 安全处理订单数据
            const secureOrder = this.createSecureOrder(orderData);
            
            // 保存到本地（实际应用中应该保存到服务器）
            this.saveOrder(secureOrder);
            
            // 记录操作
            this.logAction('order_submitted', { orderId: secureOrder.id });
            
            alert('订单提交成功！');
            return true;
            
        } catch (error) {
            console.error('订单提交失败:', error);
            alert('提交失败，请重试');
            return false;
        }
    },

    validateOrder: function(order) {
        return order.pickupLocation && 
               order.deliveryLocation && 
               order.pickupCode;
    },

    createSecureOrder: function(orderData) {
        return {
            id: 'order_' + Date.now(),
            pickupLocation: InputValidator.sanitize(orderData.pickupLocation),
            deliveryLocation: InputValidator.sanitize(orderData.deliveryLocation),
            pickupCode: Security.encrypt(orderData.pickupCode), // 加密取件码
            reward: parseFloat(orderData.reward) || 5,
            notes: InputValidator.sanitize(orderData.notes),
            status: 'pending',
            createdAt: new Date().toISOString(),
            createdBy: UserManager.initUser().id,
            securityHash: this.generateSecurityHash(orderData)
        };
    },

    generateSecurityHash: function(data) {
        // 生成简单哈希用于完整性验证
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    },

    saveOrder: function(order) {
        const orders = Security.getSecureItem('delivery_orders') || [];
        orders.push(order);
        Security.setSecureItem('delivery_orders', orders);
    },

    logAction: function(action, details) {
        const actions = Security.getSecureItem('user_actions') || [];
        actions.push({
            action: action,
            details: details,
            time: Date.now()
        });
        Security.setSecureItem('user_actions', actions);
    }
};

// ==================== 初始化函数 ====================
function initSecuritySystem() {
    console.log('🔒 初始化安全系统...');
    
    // 初始化用户
    const user = UserManager.initUser();
    console.log('用户初始化完成:', user.id);
    
    // 更新界面显示
    updateSecurityDisplay();
    
    // 启动威胁检测
    setTimeout(() => {
        ThreatDetector.checkSuspiciousActivity();
    }, 1000);
    
    console.log('✅ 安全系统启动完成');
}

function updateSecurityDisplay() {
    // 更新安全状态显示
    const encryptionStatus = document.getElementById('encryption-status');
    const threatStatus = document.getElementById('threat-status');
    const lastScan = document.getElementById('last-scan');
    
    if (encryptionStatus) encryptionStatus.textContent = '✅ 已启用';
    if (threatStatus) threatStatus.textContent = '✅ 运行中';
    if (lastScan) lastScan.textContent = new Date().toLocaleTimeString();
}

// ==================== 全局函数（供HTML调用） ====================
function submitOrder() {
    const orderData = {
        pickupLocation: document.getElementById('pickup-location').value,
        deliveryLocation: document.getElementById('delivery-location').value,
        pickupCode: document.getElementById('pickup-code').value,
        reward: document.getElementById('reward').value,
        notes: document.getElementById('notes').value
    };
    
    const success = OrderManager.submitOrder(orderData);
    if (success) {
        showPage('home-page');
        // 清空表单
        document.getElementById('pickup-location').value = '';
        document.getElementById('delivery-location').value = '';
        document.getElementById('pickup-code').value = '';
        document.getElementById('notes').value = '';
    }
}

function authAsTaker() {
    const name = document.getElementById('taker-name').value;
    const contact = document.getElementById('taker-contact').value;
    
    if (!name || !contact) {
        alert('请填写姓名和联系方式');
        return;
    }
    
    // 更新用户信息
    UserManager.updateUser({
        name: name,
        contact: contact,
        isTaker: true
    });
    
    alert('授权成功！');
    document.getElementById('available-orders').style.display = 'block';
    loadAvailableOrders();
}

function loadAvailableOrders() {
    const orders = Security.getSecureItem('delivery_orders') || [];
    const pendingOrders = orders.filter(order => order.status === 'pending');
    
    const ordersContainer = document.getElementById('orders-to-take');
    if (pendingOrders.length === 0) {
        ordersContainer.innerHTML = '<p>暂无待接订单</p>';
    } else {
        ordersContainer.innerHTML = pendingOrders.map(order => `
            <div class="card" style="margin: 10px 0; padding: 10px;">
                <p><strong>取件:</strong> ${order.pickupLocation}</p>
                <p><strong>送达:</strong> ${order.deliveryLocation}</p>
                <p><strong>酬劳:</strong> ${order.reward}元</p>
                <button class="btn btn-primary" onclick="takeOrder('${order.id}')">接单</button>
            </div>
        `).join('');
    }
}

function takeOrder(orderId) {
    const orders = Security.getSecureItem('delivery_orders') || [];
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].status = 'taken';
        orders[orderIndex].takenBy = UserManager.initUser().id;
        orders[orderIndex].takenAt = new Date().toISOString();
        
        Security.setSecureItem('delivery_orders', orders);
        alert('接单成功！');
        loadAvailableOrders();
    }
}

function exportData() {
    const user = Security.getSecureItem('currentUser');
    const orders = Security.getSecureItem('delivery_orders') || [];
    const logs = Security.getSecureItem('security_logs') || [];
    
    const exportData = {
        user: user,
        orders: orders,
        securityLogs: logs,
        exportTime: new Date().toISOString(),
        version: SECURITY_CONFIG.VERSION
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `secure_backup_${Date.now()}.json`;
    link.click();
    
    alert('数据导出成功！');
}

function clearData() {
    if (confirm('确定要清理所有本地数据吗？这将删除所有订单和设置。')) {
        localStorage.clear();
        alert('数据清理完成，页面将刷新');
        location.reload();
    }
}

function showSecurityLogs() {
    const logs = Security.getSecureItem('security_logs') || [];
    alert('安全日志: ' + JSON.stringify(logs, null, 2));
}

// 自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecuritySystem);
} else {
    initSecuritySystem();
}