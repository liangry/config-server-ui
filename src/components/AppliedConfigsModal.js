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
import {AppliedConfigsContext, ConfigOptionsContext, RootContext} from "../common/context";
import {interactive} from "../common/request";
import ConfigOptionsModal from "./ConfigOptionsModal";

import AceEditor from "react-ace";

import 'brace/mode/yaml';
import 'brace/theme/xcode';
import {configTypes} from "../common/const";
import {mapConfig, markAppliedConfig} from "../common/mapper";
import {PlusOutlined} from "@ant-design/icons";

export default () => {
  const {root} = useContext(RootContext);
  const {
    appliedConfigsVisible,
    setAppliedConfigsVisible,
    agentGroup,
    fetchAgentGroupSummaries,
  } = useContext(AppliedConfigsContext);

  const [appliedConfigs, setAppliedConfigs] = useState([]);
  const [configsBuffer, setConfigsBuffer] = useState([]);
  const [activeAppliedConfigTab, setActiveAppliedConfigTab] = useState('');
  const [configOptions, setConfigOptions] = useState([]);
  const [configOptionsVisible, setConfigOptionsVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (appliedConfigsVisible) {
      fetchAppliedConfigs(agentGroup.groupName);
    }
  }, [appliedConfigsVisible]);

  useEffect(() => {
    if (appliedConfigs.length > 0) {
      setActiveAppliedConfigTab(appliedConfigs[0].key);
    }
  }, [appliedConfigs]);

  const fetchAppliedConfigs = (groupName) => {
    const params = {
      groupName,
    };
    interactive(root, `GetAppliedConfigsForAgentGroup`, params).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }
      const requests = response.configNames.map(configName => {
        return interactive(root, 'GetConfig', {
          configName,
        });
      });
      // res: [[ok, statusCode, statusText, response], ...]
      const res = await Promise.all(requests);
      if (res.some(it => !it[0])) {
        const err = res.find(it => !it[0]);
        message.error(`${err[1]} ${err[2]}: ${err[3].message || 'unknown error'}`);
        return;
      }
      const data = res.map(it => mapConfig(it[3].configDetail));
      console.log(data);
      setAppliedConfigs(data);
    });
  };

  const fetchConfigOptions = () => {
    interactive(root, `ListConfigs`, {}).then(async ([ok, statusCode, statusText, response]) => {
      if (!ok) {
        message.error(`${statusCode} ${statusText}: ${response.message || 'unknown error'}`);
        return;
      }

      const data = response.configDetails.map(item => markAppliedConfig(mapConfig(item), appliedConfigs));
      console.log(data);
      setConfigOptions(data);
      setConfigOptionsVisible(true);
    });
  };

  const removeAppliedConfigs = async () => {
    if (configsBuffer.length === 0) {
      closeAppliedConfigs();
      fetchAgentGroupSummaries(agentGroup.groupName, true);
      return;
    }
    const requests = configsBuffer.map(configName => {
      return interactive(root, 'RemoveConfigFromAgentGroup', {
        groupName: agentGroup.groupName,
        configName,
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
    message.success(`Remove applied config from agent group ${agentGroup.groupName} success`);
    closeAppliedConfigs();
    fetchAgentGroupSummaries(agentGroup.groupName, true);
  };

  const closeAppliedConfigs = () => {
    setActiveAppliedConfigTab('');
    setAppliedConfigsVisible(false);
    setAppliedConfigs([]);
    setConfigsBuffer([]);
  };

  const switchAppliedConfigTab = (activeTab) => {
    setActiveAppliedConfigTab(activeTab);
  };

  const removeAppliedConfigTab = (targetTab) => {
    const buffer = [
      ...configsBuffer,
      targetTab,
    ];
    setConfigsBuffer(buffer);
    let newActiveKey = activeAppliedConfigTab;
    let lastIndex = -1;
    appliedConfigs.forEach((item, i) => {
      if (item.key === targetTab) {
        lastIndex = i - 1;
      }
    });
    const newPanes = appliedConfigs.filter((item) => item.key !== targetTab);
    if (newPanes.length && newActiveKey === targetTab) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
    }
    setAppliedConfigs(newPanes);
    setActiveAppliedConfigTab(newActiveKey);
  };

  const editAppliedConfigTab = (targetTab, action) => {
    if (action === 'remove') {
      removeAppliedConfigTab(targetTab);
    }
    if (action === 'add') {
      if (configsBuffer.length > 0) {
        message.warning(`Applied config changed, please save first`).then();
        return;
      }
      fetchConfigOptions();
    }
  };

  const meta = {
    columns: 1,
    formItemLayout: [4, 20],
    fields: [
      {
        key: 'name',
        label: <FormattedMessage id="config_name" />,
      },
      {
        key: 'type',
        label: <FormattedMessage id="config_type" />,
        viewWidget: (field) => (
          <FormattedMessage id={`${configTypes[field.value]}`} />
        ),
      },
      {
        key: 'detail',
        label: <FormattedMessage id="config_detail" />,
        viewWidget: field => (
          <AceEditor
            name="config_detail_reader"
            mode="yaml"
            theme="xcode"
            value={field.value}
            readOnly
            fontSize={13}
            width="100%"
            minLines={10}
            maxLines={20}
          />
        ),
      },
      {
        key: 'context',
        label: <FormattedMessage id="config_context" />,
      },
    ],
  };

  const appliedItems = appliedConfigs.map((item) => {
    return {
      key: item.key,
      label: item.name,
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
      title={<FormattedMessage id="applied_config_title" values={{ groupName: agentGroup.groupName }} />}
      width={800}
      open={appliedConfigsVisible}
      onOk={removeAppliedConfigs}
      onCancel={closeAppliedConfigs}
      forceRender
    >
      <Tabs
        type="editable-card"
        activeKey={activeAppliedConfigTab}
        onChange={switchAppliedConfigTab}
        onEdit={editAppliedConfigTab}
        addIcon={
          <Space style={{ padding: "8px 16px 8px 16px" }}>
            <PlusOutlined />
            <FormattedMessage id="add" />
          </Space>
        }
        items={appliedItems}
      />
      <ConfigOptionsContext.Provider
        value={{
          configOptionsVisible,
          configOptions,
          setConfigOptionsVisible,
          setConfigOptions,
          agentGroup,
          fetchAppliedConfigs,
        }}
      >
        <ConfigOptionsModal />
      </ConfigOptionsContext.Provider>
    </Modal>
  );
};
