import React, { useState, useContext } from 'react';
import { Form, Input, Button, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { register } from '../services/auth';
import { AuthContext } from '../store/authContext';

const Register = () => {
  const [form] = Form.useForm();
  const { login: authLogin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const validatePassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('password') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('两次输入的密码不一致'));
    },
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 去除确认密码字段
      const { confirmPassword, ...registerData } = values;
      
      const result = await register(registerData);
      if (result.code === 200 && result.data) {
        const { token, user } = result.data;
        message.success('注册成功，已自动登录');
        authLogin(user, token.access_token);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      message.error(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2 className="auth-title">欢迎注册 GoInk Blog</h2>
        <Spin spinning={loading}>
          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱地址" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少为6个字符' }
              ]}
              hasFeedback
            >
              <Input.Password prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码' },
                validatePassword
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="auth-form-button">
                注册
              </Button>
            </Form.Item>

            <div className="auth-form-register">
              已有账号？<Link to="/login">立即登录</Link>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default Register;
