import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Form, Input, Button, message, Upload, Avatar, Tabs, Spin, Card } from 'antd';
import { UserOutlined, MailOutlined, EditOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import { updateProfile, uploadAvatar } from '../services/auth';
import { AuthContext } from '../store/authContext';

const { TabPane } = Tabs;
const { TextArea } = Input;

const Profile = () => {
  const [basicForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user, updateUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // 使用useCallback包装resetFormToUserData函数以避免不必要的重新创建
  const resetFormToUserData = useCallback(() => {
    if (user) {
      // 转换头像URL为完整可访问的URL用于显示
      setAvatarUrl(user.avatar);
      // 初始化基本信息表单
      basicForm.setFieldsValue({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
      });
    }
  }, [user, basicForm]);

  // 现在将resetFormToUserData添加到依赖数组中
  useEffect(() => {
    resetFormToUserData();
  }, [resetFormToUserData]);

  const handleUpdateBasicInfo = async (values) => {
    setLoading(true);
    try {
      // 直接使用用户当前的avatar URL
      const result = await updateProfile({
        ...values,
        avatar: user.avatar
      });
      
      if (result.code === 200 && result.data) {
        updateUser(result.data);
        message.success('个人资料已更新');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error(error.message || '更新个人资料失败，请重试');
      // 更新失败时，重置表单至原始用户信息
      resetFormToUserData();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (values) => {
    setLoading(true);
    try {
      // 移除确认密码字段
      const { confirmPassword, ...passwordData } = values;
      
      const result = await updateProfile(passwordData);
      
      if (result.code === 200) {
        message.success('密码已更新');
        passwordForm.resetFields();
      }
    } catch (error) {
      console.error('Failed to update password:', error);
      message.error(error.message || '更新密码失败，请重试');
      // 更新失败时，重置密码表单
      passwordForm.resetFields();
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
    }
    
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过2MB!');
    }
    
    return isImage && isLt2M;
  };

  const handleAvatarUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const result = await uploadAvatar(formData);
      
      if (result.code === 200 && result.data) {
        // 获取后端返回的头像URL
        const avatarUrl = result.data.url;
        setAvatarUrl(avatarUrl);
        
        console.log('头像上传成功，URL:', avatarUrl);
        
        // 更新用户信息中的头像URL
        updateUser({
          ...user,
          avatar: avatarUrl
        });
        
        // 调用updateProfile来更新用户资料中的头像
        await updateProfile({
          avatar: avatarUrl
        });
        
        onSuccess('上传成功');
        message.success('头像上传成功');
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      onError(error);
      message.error('头像上传失败，请重试');
      // 上传失败时，重置头像
      setAvatarUrl(user.avatar);
    } finally {
      setUploading(false);
    }
  };

  const validatePassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue('password') === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('两次输入的密码不一致'));
    },
  });

  return (
    <div className="container">
      <Card title="个人资料设置" bordered={false} style={{ marginTop: 24 }}>
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基本信息" key="basic">
              <div className="user-avatar-upload">
                <Avatar 
                  size={100} 
                  src={avatarUrl} 
                  icon={<UserOutlined />} 
                  style={{ marginBottom: 16 }}
                />
                <Upload
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  customRequest={handleAvatarUpload}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploading}
                    type="primary"
                  >
                    更换头像
                  </Button>
                </Upload>
              </div>
              
              <Form
                form={basicForm}
                name="basic-info"
                layout="vertical"
                onFinish={handleUpdateBasicInfo}
              >
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, max: 20, message: '用户名长度必须在3-20个字符之间' }
                  ]}
                >
                  <Input prefix={<UserOutlined />} />
                </Form.Item>

                <Form.Item
                  name="email"
                  label="邮箱地址"
                  rules={[
                    { required: true, message: '请输入邮箱地址' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} />
                </Form.Item>

                <Form.Item
                  name="bio"
                  label="个人简介"
                >
                  <TextArea rows={4} placeholder="介绍一下你自己..." />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<EditOutlined />}>
                    保存更改
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
            
            <TabPane tab="修改密码" key="password">
              <Form
                form={passwordForm}
                name="password-form"
                layout="vertical"
                onFinish={handleUpdatePassword}
              >
                <Form.Item
                  name="old_password"
                  label="当前密码"
                  rules={[{ required: true, message: '请输入当前密码' }]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="新密码"
                  rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码长度至少为6个字符' }
                  ]}
                  hasFeedback
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="确认新密码"
                  dependencies={['password']}
                  hasFeedback
                  rules={[
                    { required: true, message: '请确认新密码' },
                    validatePassword
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<EditOutlined />}>
                    更新密码
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </Spin>
      </Card>
    </div>
  );
};

export default Profile;
