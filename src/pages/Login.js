import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { login, getCaptchaId, getCaptchaImageUrl } from '../services/auth';
import { AuthContext } from '../store/authContext';

const Login = () => {
  const [form] = Form.useForm();
  const { login: authLogin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    fetchCaptchaId();
  }, []);

  const fetchCaptchaId = async () => {
    try {
      const result = await getCaptchaId();
      if (result.code === 200 && result.data) {
        const id = result.data.captcha_id;
        setCaptchaId(id);
        setCaptchaUrl(getCaptchaImageUrl(id));
      }
    } catch (error) {
      message.error('获取验证码失败，请刷新页面重试');
      console.error('Failed to get captcha id:', error);
    }
  };

  // 这个函数现在将始终获取新的验证码ID
  const refreshCaptcha = () => {
    // 不再使用旧的captchaId，而是直接获取新的
    fetchCaptchaId();
    // 更新刷新计数器以防止浏览器缓存
    setRefreshCounter(prev => prev + 1);
  };

  const handleSubmit = async (values) => {
    if (!captchaId) {
      message.error('验证码加载失败，请刷新验证码重试');
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...values,
        captcha_id: captchaId
      };
      
      const result = await login(data);
      if (result.code === 200 && result.data) {
        const { token, user } = result.data;
        authLogin(user, token.access_token);
      }
    } catch (error) {
      console.error('Login failed:', error);
      message.error(error.message || '登录失败，请重试');
      // 登录失败后获取全新的验证码ID
      refreshCaptcha();
      // 清空验证码输入框 - 修复清空验证码输入框的问题
      form.resetFields(['captcha']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="auth-title">欢迎登录 GoInk Blog</h2>
        <Spin spinning={loading}>
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item
              name="captcha"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <div className="auth-captcha">
                <Input prefix={<SafetyOutlined />} placeholder="验证码" />
                {captchaUrl && (
                  <img
                    src={`${captchaUrl}&_r=${refreshCounter}`}
                    alt="验证码"
                    className="auth-captcha-img"
                    onClick={refreshCaptcha}
                    style={{ height: '38px', marginLeft: '8px', cursor: 'pointer' }}
                  />
                )}
              </div>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-form-button">
                登录
              </Button>
            </Form.Item>

            <div className="auth-form-register">
              没有账号？<Link to="/register">立即注册</Link>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default Login;
