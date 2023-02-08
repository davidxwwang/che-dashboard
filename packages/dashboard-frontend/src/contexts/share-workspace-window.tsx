/*
 * Copyright (c) 2018-2021 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import {
    Button,
    ButtonVariant,
    Checkbox,
    Menu,
    MenuContent,
    MenuItem,
    MenuList,
    Modal,
    ModalVariant,
  } from '@patternfly/react-core';
import React, { useState } from 'react';
import { listShareWorkspaceCandidates } from '../services/dashboard-backend-client/devWorkspaceApi';
import { api } from '@eclipse-che/common'

interface ShareDevWsWindowProps{
    isOpen: boolean;
    allUserCandidates: Array<api.User>;
    closeWindow: () => void;
    shareWorkspaceToUser: (shareUser: Array<api.User>) => void;
}

const getSharedUserIds = (allCandis: Array<api.User>): Array<string> =>{
    const a = allCandis.filter(each => {return each.shared === true})
    return a.map(each => each.userID)   
}

export const ShareDevWsWindow: React.FunctionComponent<ShareDevWsWindowProps> = ({isOpen, allUserCandidates, closeWindow, shareWorkspaceToUser}) => {

    // 选中的分享的人列表,只包括itemId
    const [selectUsers, setSelectUsers] = useState<string[]>(getSharedUserIds(allUserCandidates))

   // const selectedUsernameList: Array<string> = getSharedUserIds(allUserCandidates);

    const handleWindowToggle = () => {
        closeWindow();
    }

    const doShareDevWorkspace = () => {
        // todo 
        console.log('do share')
        const selectedCandis = allUserCandidates.filter(each => { return selectUsers.includes(each.username) })
        shareWorkspaceToUser(selectedCandis)
        closeWindow();
    }

    // 选中的响应方法
    const onSelectUser = (event: React.MouseEvent<Element, MouseEvent> | undefined, username: string | number | undefined) => {
        const _username = username as string
        if(selectUsers.includes(_username)){
            setSelectUsers(selectUsers.filter(id => id != _username))
        }else{
            setSelectUsers([...selectUsers, _username])
        }
    }
    
    const body = (
        <Menu onSelect={onSelectUser} selected = {selectUsers}>
            <MenuContent>
                <MenuList>                
                    {
                        allUserCandidates.map(candi => {
                            return (<MenuItem key={candi.userID} itemId={candi.username} isSelected={selectUsers.includes(candi.userID)}>
                                {candi.username}
                            </MenuItem>)
                        })
                    }
                </MenuList>
            </MenuContent>
        </Menu>
    );

    const footer = (
    <React.Fragment>
        <Button
        variant={ButtonVariant.danger}
        isDisabled={false}
        data-testid="delete-workspace-button"
        onClick={() => doShareDevWorkspace()}
        >
        Share
        </Button>
        <Button
        variant={ButtonVariant.link}
        data-testid="cancel-workspace-button"
        onClick={() => {handleWindowToggle()}}
        >
        Cancel
        </Button>
    </React.Fragment>
    );

    return (
    <Modal
        title="Share Workspace"
        titleIconVariant="warning"
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => {handleWindowToggle()}}
        aria-label="Delete workspaces confirmation window"
        footer={footer}
    >
        {body}
    </Modal>
    );
      
}

