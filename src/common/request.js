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

import {v4 as uuidv4} from 'uuid';

const methods = {
  CreateAgentGroup: 'POST',
  UpdateAgentGroup: 'PUT',
  DeleteAgentGroup: 'DELETE',
  GetAgentGroup: 'POST',
  ListAgentGroups: 'POST',

  CreateConfig: 'POST',
  UpdateConfig: 'PUT',
  DeleteConfig: 'DELETE',
  GetConfig: 'POST',
  ListConfigs: 'POST',

  ApplyConfigToAgentGroup: 'PUT',
  RemoveConfigFromAgentGroup: 'DELETE',
  GetAppliedConfigsForAgentGroup: 'POST',
  GetAppliedAgentGroups: 'POST',
  ListAgents: 'POST',
};

export const interactive = async (root, action, params) => {
  const reqType = root.lookupType(`configserver.proto.${action}Request`);
  const message = reqType.create({
    requestId: uuidv4(),
    ...params,
  });
  // console.log(`request message = ${JSON.stringify(message)}`);
  const body = reqType.encode(message).finish();
  // console.log(`request raw body = ${Array.prototype.toString.call(body)}`);

  const options = {
    method: methods[action],
    body,
    headers: {
      'Content-Type': 'application/x-protouf',
    },
  };
  const response = await fetch(`/api/v1/User/${action}`, options);
  try {
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    // const contentLength = parseInt(response.headers.get("content-length"));
    // console.log(`response content length: ${contentLength}, raw body: ${data}`);
    const respType = root.lookupType(`configserver.proto.${action}Response`);
    // console.log(`decoded response body: ${JSON.stringify(respType.decode(data))}`);
    return [response.ok, response.status, response.statusText, respType.decode(data)];
  } catch (e) {
    return [response.ok, response.status, response.statusText, { message: `${methods[action]} ${action}`}];
  }
};
