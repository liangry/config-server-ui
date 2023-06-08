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

import {Form, message, Modal, Space, Tabs} from "antd";
import {FormattedMessage} from "react-intl";
import FormBuilder from "antd-form-builder";
import React, {useContext, useEffect, useState} from "react";
import {AppliedAgentGroupsContext, AgentGroupOptionsContext, RootContext} from "../common/context";
import {interactive} from "../common/request";
import AgentGroupOptionsModal from "./AgentGroupOptionsModal";
import {mapAgentGroup, markAppliedAgentGroup} from "../common/mapper";
import {mapTags} from "../common/util";
import {PlusOutlined} from "@ant-design/icons";

export default () => {
  const {root} = useContext(RootContext);
  const {
    appliedAgentGroupsVisible,
    setAppliedAgentGroupsVisible,
    config,
    fetchConfigSummaries,
  } = useContext(AppliedAgentGroupsContext);

  const [appliedAgentGroups, setAppliedAgentGroups] = useState([]);
  const [agentGroupsBuffer, setAgentGroupsBuffer] = useState([]);
  const [activeAppliedAgentGroupTab, setActiveAppliedAgentGroupTab] = useState('');
  const [agentGroupOptions, setAgentGroupOptions] = useState([]);
  const [agentGroupOptionsVisible, setAgentGroupOptionsVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (appliedAgentGroupsVisible) {
      fetchAppliedAgentGroups(config.name);
    }
  }, [appliedAgentGroupsVisible]);

  useEffect(() => {
    if (appliedAgentGroups.length > 0) {
      setActiveAppliedAgentGroupTab(appliedAgentGroups[0].key);
    }
  }, [appliedAgentGroups]);

  const fetchAppliedAgentGroups = (configName) => {
    const params = {
      configName,
    };
    interactive(root, `GetAppliedAgentGroups`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      const requests = response.agentGroupNames.map(groupName => {
        return interactive(root, 'GetAgentGroup', {
          groupName,
        });
      });
      // res: [[ok, statusCode, statusText, response], ...]
      const res = await Promise.all(requests);
      if (res.some(it => !it[0])) {
        const err = res.find(it => !it[0]);
        message.error(`${err[1]} ${err[2]}: ${err[3].message || 'unknown error'}`);
        return;
      }
      const data = res.map(it => mapAgentGroup(it[3].agentGroup));
      console.log(data);
      setAppliedAgentGroups(data);
    });
  };

  const fetchAgentGroupOptions = () => {
    interactive(root, `ListAgentGroups`, {}).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }

      const appliedGroupNames = appliedAgentGroups.map(it => it.groupName);
      const data = response.agentGroups.map(item => markAppliedAgentGroup(mapAgentGroup(item), appliedGroupNames));
      console.log(data);
      setAgentGroupOptions(data);
      setAgentGroupOptionsVisible(true);
    });
  };

  const removeAppliedAgentGroups = async () => {
    if (agentGroupsBuffer.length === 0) {
      closeAppliedAgentGroups();
      fetchConfigSummaries(config.name, true);
      return;
    }
    const requests = agentGroupsBuffer.map(groupName => {
      return interactive(root, 'RemoveConfigFromAgentGroup', {
        groupName,
        configName: config.name,
      });
    });
    // res: [[ok, statusCode, statusText, response], ...]
    const res = await Promise.all(requests);
    if (res.some(it => !it[0])) {
      const err = res.find(it => !it[0]);
      message.error(`${err[1]} ${err[2]}: ${err[3].message || 'unknown error'}`);
      return;
    }
    console.log(res.map(it => it[3].message));
    message.success(`Remove applied agent group from config ${config.name} success`);
    closeAppliedAgentGroups();
    fetchConfigSummaries(config.name, true);
  };

  const closeAppliedAgentGroups = () => {
    setActiveAppliedAgentGroupTab('');
    setAppliedAgentGroupsVisible(false);
    setAppliedAgentGroups([]);
    setAgentGroupsBuffer([]);
  };

  const switchAppliedConfigTab = (activeTab) => {
    setActiveAppliedAgentGroupTab(activeTab);
  };

  const removeAppliedAgentGroupTab = (targetTab) => {
    const buffer = [
      ...agentGroupsBuffer,
      targetTab,
    ];
    setAgentGroupsBuffer(buffer);
    let newActiveKey = activeAppliedAgentGroupTab;
    let lastIndex = -1;
    appliedAgentGroups.forEach((item, i) => {
      if (item.key === targetTab) {
        lastIndex = i - 1;
      }
    });
    const newPanes = appliedAgentGroups.filter((item) => item.key !== targetTab);
    if (newPanes.length && newActiveKey === targetTab) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    setAppliedAgentGroups(newPanes);
    setActiveAppliedAgentGroupTab(newActiveKey);
  };

  const editAppliedAgentGroupTab = (targetTab, action) => {
    if (action === 'remove') {
      removeAppliedAgentGroupTab(targetTab);
    }
    if (action === 'add') {
      if (agentGroupsBuffer.length > 0) {
        message.warning(`Applied agent group changed, please save first`).then();
        return;
      }
      fetchAgentGroupOptions();
    }
  };

  const meta = {
    columns: 1,
    formItemLayout: [4, 20],
    fields: [
      {
        key: 'groupName',
        label: <FormattedMessage id="group_name" />,
      },
      {
        key: 'description',
        label: <FormattedMessage id="group_description" />,
      },
      {
        key: 'tags',
        label: <FormattedMessage id="group_tags" />,
        viewWidget: (field) => mapTags(field.value),
      },
    ],
  };

  const appliedItems = appliedAgentGroups.map((item) => {
    return {
      key: item.key,
      label: item.groupName,
      children:
        <Form
          layout="horizontal"
          form={form}
        >
          <FormBuilder
            meta={meta}
            form={form}
            initialValues={item}
            viewMode
          />
        </Form>
    };
  });

  return (
    <Modal
      title={<FormattedMessage id="applied_agent_group_title" values={{ configName: config.name }} />}
      width={800}
      open={appliedAgentGroupsVisible}
      onOk={removeAppliedAgentGroups}
      onCancel={closeAppliedAgentGroups}
      forceRender
    >
      <Tabs
        type="editable-card"
        activeKey={activeAppliedAgentGroupTab}
        onChange={switchAppliedConfigTab}
        onEdit={editAppliedAgentGroupTab}
        addIcon={
          <Space style={{ padding: "8px 16px 8px 16px" }}>
            <PlusOutlined />
            <FormattedMessage id="add" />
          </Space>
        }
        items={appliedItems}
      />
      <AgentGroupOptionsContext.Provider
        value={{
          agentGroupOptionsVisible,
          agentGroupOptions,
          setAgentGroupOptionsVisible,
          setAgentGroupOptions,
          config,
          fetchAppliedAgentGroups,
        }}
      >
        <AgentGroupOptionsModal />
      </AgentGroupOptionsContext.Provider>
    </Modal>
  );
};
