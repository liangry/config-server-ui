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

import React, {useState} from 'react';
import {Button, Card} from 'antd';
import {FormattedMessage, IntlProvider} from 'react-intl';
import {messages} from "./i18n/message";
import AgentGroupsTable from "./components/AgentGroupsTable";
import ConfigsTable from "./components/ConfigsTable";
import {AgentGroupsContext, ConfigsContext} from "./common/context";

function App() {
  const [tabKey, setTabKey] = useState('AgentGroup');
  const [agentGroup, setAgentGroup] = useState({});
  const [agentGroupVisible, setAgentGroupVisible] = useState(false);
  const [config, setConfig] = useState({});
  const [configVisible, setConfigVisible] = useState(false);

  const onTabChange = (value) => {
    setTabKey(value);
  };

  const onCreateClick = () => {
    if (tabKey === 'AgentGroup') {
      setAgentGroup({});
      setAgentGroupVisible(true);
    }
    if (tabKey === 'Config') {
      setConfig({});
      setConfigVisible(true);
    }
  };

  const tabList = [
    {
      key: 'AgentGroup',
      tab: <FormattedMessage id="agent_group" />
    },
    {
      key: 'Config',
      tab: <FormattedMessage id="config" />
    },
  ];

  const locale = 'zh-CN';

  return (
    <IntlProvider
      messages={messages[locale]}
      locale={locale}
    >
      <Card
        bordered={false}
        title={
          <FormattedMessage id="main_title" />
        }
        activeTabKey={tabKey}
        tabList={tabList}
        onTabChange={onTabChange}
        tabBarExtraContent={
          <Button onClick={onCreateClick}>
            <FormattedMessage id="create" />
          </Button>
        }
      >
        {tabKey === 'AgentGroup' && (
          <AgentGroupsContext.Provider
            value={{
              agentGroup,
              agentGroupVisible,
              setAgentGroup,
              setAgentGroupVisible,
            }}
          >
            <AgentGroupsTable />
          </AgentGroupsContext.Provider>
        )}
        {tabKey === 'Config' && (
          <ConfigsContext.Provider
            value={{
              config,
              configVisible,
              setConfig,
              setConfigVisible,
            }}
          >
            <ConfigsTable />
          </ConfigsContext.Provider>
        )}
      </Card>
    </IntlProvider>
  );
}

export default App;
