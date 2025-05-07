import React, { useState } from 'react';
import { Button, Modal, Table, Typography } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Paragraph, Text } = Typography;

const MarkdownHelper = () => {
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const markdownExamples = [
    {
      key: '1',
      syntax: '# 标题',
      description: '一级标题 (使用 # 到 ###### 表示1-6级标题)',
      example: <Text strong>标题</Text>,
    },
    {
      key: '2',
      syntax: '**粗体**',
      description: '文字加粗',
      example: <Text strong>粗体</Text>,
    },
    {
      key: '3',
      syntax: '*斜体*',
      description: '文字倾斜',
      example: <Text italic>斜体</Text>,
    },
    {
      key: '4',
      syntax: '[链接文字](https://example.com)',
      description: '添加超链接',
      example: <a href="https://example.com">链接文字</a>,
    },
    {
      key: '5',
      syntax: '![图片描述](图片链接)',
      description: '插入图片',
      example: '图片',
    },
    {
      key: '6',
      syntax: '- 无序列表项\n- 第二项',
      description: '无序列表',
      example: (
        <>
          • 无序列表项<br />
          • 第二项
        </>
      ),
    },
    {
      key: '7',
      syntax: '1. 有序列表项\n2. 第二项',
      description: '有序列表',
      example: (
        <>
          1. 有序列表项<br />
          2. 第二项
        </>
      ),
    },
    {
      key: '8',
      syntax: '> 引用文字',
      description: '引用',
      example: <Text type="secondary" style={{ borderLeft: '3px solid #ddd', paddingLeft: 8 }}>引用文字</Text>,
    },
    {
      key: '9',
      syntax: '`代码`',
      description: '行内代码',
      example: <Text code>代码</Text>,
    },
    {
      key: '10',
      syntax: '```\n代码块\n```',
      description: '代码块',
      example: <Text code style={{ display: 'block', padding: '4px' }}>代码块</Text>,
    },
    {
      key: '11',
      syntax: '---',
      description: '水平分割线',
      example: <div style={{ borderTop: '1px solid #ddd', width: '100%' }}></div>,
    },
  ];

  const columns = [
    {
      title: 'Markdown语法',
      dataIndex: 'syntax',
      key: 'syntax',
      render: text => <pre style={{ margin: 0 }}>{text}</pre>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '效果',
      dataIndex: 'example',
      key: 'example',
    },
  ];

  return (
    <>
      <Button
        type="link"
        icon={<QuestionCircleOutlined />}
        onClick={showModal}
        style={{ padding: '0', height: 'auto' }}
      >
        Markdown语法帮助
      </Button>

      <Modal
        title="Markdown语法帮助"
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Typography>
          <Paragraph>
            评论支持Markdown语法，让您的评论更加丰富多彩。下面是一些常用的Markdown语法：
          </Paragraph>

          <Table
            columns={columns}
            dataSource={markdownExamples}
            pagination={false}
            size="small"
          />

          <Paragraph style={{ marginTop: 16 }}>
            您可以通过编辑器上方的工具栏快速插入Markdown标记，或切换到"预览"标签查看效果。
          </Paragraph>
        </Typography>
      </Modal>
    </>
  );
};

export default MarkdownHelper;