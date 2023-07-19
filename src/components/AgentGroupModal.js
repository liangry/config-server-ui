// Copyright 2023 iLogtail Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Button, Form, Input, message, Modal, Space, Table} from "antd";
import {FormattedMessage} from "react-intl";
import FormBuilder from "antd-form-builder";
import React, {useContext, useEffect, useState} from "react";
import {AgentGroupContext, RootContext} from "../common/context";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {interactive} from "../common/request";
import {mapTimestamp} from "../common/util";
import {mapAgent} from "../common/mapper";
import {runningStatus, tagOperators} from "../common/const";

export default () => {
  const {root} = useContext(RootContext);
  const {
    agentGroupVisible,
    agentGroup,
    setAgentGroupVisible,
    setAgentGroup,
    fetchDataSource,
  } = useContext(AgentGroupContext);

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [agents, setAgents] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (agentGroupVisible) {
      form.setFieldsValue(agentGroup);
      if (agentGroup.groupName) {
        setAction('UpdateAgentGroup');
        fetchAgents(agentGroup.groupName);
      } else {
        setAction('CreateAgentGroup');
      }
    } else {
      form.resetFields();
      setAction('');
    }
  }, [agentGroupVisible]);

  const closeAgentGroup = () => {
    setAgentGroup({});
    setAgentGroupVisible(false);
  };

  const submitAgentGroup = (values) => {
    const params = {
      agentGroup: {
        ...values,
      },
    };
    setLoading(true);
    interactive(root, action, params).then(async ([ok, statusCode, statusText, response]) => {
      setLoading(false);
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      console.log(response.message);
      message.success(`Agent group ${form.getFieldValue('name')} created or updated`);
      closeAgentGroup();
      fetchDataSource();
    });
  };

  const fetchAgents = (groupName) => {
    const params = {
      groupName,
    };
    interactive(root, `ListAgents`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        console.log(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      const data = response.agents.map((item) => mapAgent(item));
      console.log(data);
      setAgents(data);
    });
  };

  const meta = {
    columns: 1,
    formItemLayout: [4, 20],
    fields: [
      {
        key: 'groupName',
        label: <FormattedMessage id="group_name" />,
        disabled: action === 'UpdateAgentGroup' || agentGroup.groupName === 'default',
        required: action === 'CreateAgentGroup',
        message: <FormattedMessage id="form_item_required" />,
      },
      {
        key: 'description',
        label: <FormattedMessage id="group_description" />,
        disabled: agentGroup.groupName === 'default',
        required: true,
        message: <FormattedMessage id="form_item_required" />,
      },
      {
        key: 'tags',
        label: <FormattedMessage id="group_tags" />,
        widget: () => {
          if (agentGroup.groupName === 'default') {
            return <Input placeholder="Default agent group does not have tags." disabled />
          }
          return (
            <Form.List name="tags">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex' }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        rules={[{
                          required: true,
                          message: <FormattedMessage id="form_item_required" />,
                        }]}
                        style={{ width: 150, marginBottom: 4 }}
                      >
                        <Input placeholder="Key" />
                      </Form.Item>
                      =
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{
                          required: true,
                          message: <FormattedMessage id="form_item_required" />,
                        }]}
                        style={{ width: 400, marginBottom: 4 }}
                      >
                        <Input placeholder="Value" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      <FormattedMessage id="add_field" />
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          );
        },
      },
      {
        key: 'tagOperator',
        label: <FormattedMessage id="group_tag_operator" />,
        message: <FormattedMessage id="form_item_required" />,
        widget: 'radio-group',
        buttonGroup: true,
        options: tagOperators.map((item, index) => {
          return {
            value: index,
            label: <FormattedMessage id={item} />,
          };
        }),
      },
    ],
  };

  const agentColumns = [
    // {
    //   key: 'agentId',
    //   dataIndex: 'agentId',
    //   title: <FormattedMessage id="agent_id" />,
    // },
    {
      key: 'version',
      dataIndex: 'version',
      title: <FormattedMessage id="agent_version" />,
    },
    {
      key: 'ip',
      dataIndex: 'ip',
      title: <FormattedMessage id="agent_ip" />,
    },
    {
      key: 'runningStatus',
      dataIndex: 'runningStatus',
      title: <FormattedMessage id="agent_running_status" />,
      render: (v) => runningStatus[v],
    },
    {
      key: 'startupTime',
      dataIndex: 'startupTime',
      title: <FormattedMessage id="agent_startup_time" />,
      render: (ts) => mapTimestamp(ts),
    },
    {
      key: 'latestBeatTime',
      dataIndex: 'latestBeatTime',
      title: <FormattedMessage id="agent_latest_beat_time" />,
      render: (ts) => mapTimestamp(ts),
    },
  ];

  return (
    <Modal
      title={<FormattedMessage id="group_open_title" />}
      width={800}
      open={agentGroupVisible}
      onCancel={closeAgentGroup}
      forceRender
      footer={[]}
    >
      <Form
        layout="horizontal"
        form={form}
        onFinish={submitAgentGroup}
      >
        <FormBuilder
          meta={meta}
          form={form}
          initialValues={{
            tagOperator: 0,
          }}
        />
        {action === 'UpdateAgentGroup' && (
          <Form.Item
            label={<FormattedMessage id="agent_title" />}
            labelCol={{ span: 4 }}
          >
            <Table
              size="small"
              dataSource={agents}
              columns={agentColumns}
            />
          </Form.Item>
        )}
        <Form.Item wrapperCol={{ offset: 4 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
          >
            <FormattedMessage id="group_save" />
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};
