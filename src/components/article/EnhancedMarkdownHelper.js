import React, { useState } from 'react';
import { Button, Modal, Table, Typography, Tabs } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Paragraph, Text, Title, Link } = Typography;

const EnhancedMarkdownHelper = () => {
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  // 基础语法示例
  const basicMarkdownExamples = [
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
      syntax: '~~删除线~~',
      description: '添加删除线',
      example: <Text delete>删除线</Text>,
    },
    {
      key: '5',
      syntax: '[链接文字](https://example.com)',
      description: '添加超链接',
      example: <a href="https://example.com">链接文字</a>,
    },
    {
      key: '6',
      syntax: '![图片描述](图片链接)',
      description: '插入图片',
      example: '图片',
    },
    {
      key: '7',
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
      key: '8',
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
      key: '9',
      syntax: '> 引用文字',
      description: '引用',
      example: <Text type="secondary" style={{ borderLeft: '3px solid #ddd', paddingLeft: 8 }}>引用文字</Text>,
    },
    {
      key: '10',
      syntax: '`代码`',
      description: '行内代码',
      example: <Text code>代码</Text>,
    },
    {
      key: '11',
      syntax: '```\n代码块\n```',
      description: '代码块',
      example: <Text code style={{ display: 'block', padding: '4px' }}>代码块</Text>,
    },
    {
      key: '12',
      syntax: '---',
      description: '水平分割线',
      example: <div style={{ borderTop: '1px solid #ddd', width: '100%' }}></div>,
    },
  ];

  // 高级语法示例
  const advancedMarkdownExamples = [
    {
      key: '1',
      syntax: '- [ ] 未完成任务\n- [x] 已完成任务',
      description: '任务列表',
      example: (
        <>
          ☐ 未完成任务<br />
          ☑ 已完成任务
        </>
      ),
    },
    {
      key: '2',
      syntax: '| 表头1 | 表头2 |\n| --- | --- |\n| 单元格1 | 单元格2 |',
      description: '表格',
      example: (
        <table border="1" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px 8px' }}>表头1</th>
              <th style={{ padding: '4px 8px' }}>表头2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '4px 8px' }}>单元格1</td>
              <td style={{ padding: '4px 8px' }}>单元格2</td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      key: '3',
      syntax: '脚注[^1]\n\n[^1]: 脚注内容',
      description: '脚注',
      example: (
        <>
          脚注<sup>1</sup><br />
          <small>1. 脚注内容</small>
        </>
      ),
    },
    {
      key: '4',
      syntax: '```javascript\nconst greeting = "Hello";\nconsole.log(greeting);\n```',
      description: '语法高亮代码块',
      example: (
        <div style={{ background: '#f5f5f5', padding: '8px', fontFamily: 'monospace' }}>
          <span style={{ color: '#07a' }}>const</span> <span style={{ color: '#690' }}>greeting</span> = <span style={{ color: '#d14' }}>"Hello"</span>;<br />
          <span style={{ color: '#690' }}>console</span>.<span style={{ color: '#690' }}>log</span>(<span style={{ color: '#690' }}>greeting</span>);
        </div>
      ),
    },
    {
      key: '5',
      syntax: '==高亮文本==',
      description: '高亮文本 (部分Markdown编辑器支持)',
      example: <Text mark>高亮文本</Text>,
    },
    {
      key: '6',
      syntax: 'H~2~O',
      description: '下标 (部分Markdown编辑器支持)',
      example: (
        <>
          H<sub>2</sub>O
        </>
      ),
    },
    {
      key: '7',
      syntax: '2^10^',
      description: '上标 (部分Markdown编辑器支持)',
      example: (
        <>
          2<sup>10</sup>
        </>
      ),
    },
  ];

  // 编辑器快捷键示例
  const shortcutExamples = [
    {
      key: '1',
      shortcut: 'Ctrl/Cmd + B',
      description: '添加粗体',
    },
    {
      key: '2',
      shortcut: 'Ctrl/Cmd + I',
      description: '添加斜体',
    },
    {
      key: '3',
      shortcut: 'Ctrl/Cmd + K',
      description: '添加链接',
    },
    {
      key: '4',
      shortcut: 'Ctrl/Cmd + Z',
      description: '撤销',
    },
    {
      key: '5',
      shortcut: 'Ctrl/Cmd + Shift + Z',
      description: '重做',
    },
    {
      key: '6',
      shortcut: 'Tab',
      description: '缩进',
    },
    {
      key: '7',
      shortcut: 'Shift + Tab',
      description: '减少缩进',
    },
    {
      key: '8',
      shortcut: 'F11',
      description: '切换全屏模式',
    },
  ];

  const basicColumns = [
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

  const advancedColumns = [
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

  const shortcutColumns = [
    {
      title: '快捷键',
      dataIndex: 'shortcut',
      key: 'shortcut',
      render: text => <kbd>{text}</kbd>,
    },
    {
      title: '功能',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <>
      <Button
        type="text"
        icon={<QuestionCircleOutlined />}
        onClick={showModal}
      >
        Markdown帮助
      </Button>

      <Modal
        title="Markdown语法帮助"
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Tabs 
          defaultActiveKey="1"
          items={[
            {
              key: '1',
              label: '基础语法',
              children: (
                <Typography>
                  <Paragraph>
                    Markdown是一种轻量级标记语言，让您通过简单的语法格式化文字。下面是基础Markdown语法：
                  </Paragraph>

                  <Table
                    columns={basicColumns}
                    dataSource={basicMarkdownExamples}
                    pagination={false}
                    size="small"
                  />
                </Typography>
              )
            },
            {
              key: '2',
              label: '高级语法',
              children: (
                <Typography>
                  <Paragraph>
                    除了基础语法外，Markdown还支持一些高级功能，让您的文档更加丰富：
                  </Paragraph>

                  <Table
                    columns={advancedColumns}
                    dataSource={advancedMarkdownExamples}
                    pagination={false}
                    size="small"
                  />
                </Typography>
              )
            },
            {
              key: '3',
              label: '快捷键',
              children: (
                <Typography>
                  <Paragraph>
                    编辑器支持以下快捷键，帮助您更高效地编辑Markdown文档：
                  </Paragraph>

                  <Table
                    columns={shortcutColumns}
                    dataSource={shortcutExamples}
                    pagination={false}
                    size="small"
                  />
                </Typography>
              )
            },
            {
              key: '4',
              label: 'Markdown指南',
              children: (
                <Typography>
                  <Title level={4}>什么是Markdown？</Title>
                  <Paragraph>
                    Markdown是一种轻量级标记语言，创建于2004年。它允许人们使用易读易写的纯文本格式编写文档，然后转换成有效的HTML文档。
                  </Paragraph>

                  <Title level={4}>为什么使用Markdown？</Title>
                  <Paragraph>
                    <ul>
                      <li>易于学习和使用</li>
                      <li>专注于内容而非格式</li>
                      <li>跨平台支持</li>
                      <li>广泛应用于技术文档、博客等</li>
                      <li>可转换为HTML、PDF等多种格式</li>
                    </ul>
                  </Paragraph>

                  <Title level={4}>学习更多</Title>
                  <Paragraph>
                    <ul>
                      <li>
                        <Link href="https://www.markdownguide.org/" target="_blank">
                          Markdown官方指南
                        </Link>
                      </li>
                      <li>
                        <Link href="https://github.github.com/gfm/" target="_blank">
                          GitHub风格Markdown规范
                        </Link>
                      </li>
                      <li>
                        <Link href="https://spec.commonmark.org/" target="_blank">
                          CommonMark规范
                        </Link>
                      </li>
                    </ul>
                  </Paragraph>
                </Typography>
              )
            }
          ]}
        />
      </Modal>
    </>
  );
};

export default EnhancedMarkdownHelper;