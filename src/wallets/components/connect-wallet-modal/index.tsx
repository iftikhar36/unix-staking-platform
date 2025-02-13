import React from 'react';

import { WalletConnector } from 'wallets/types';
import { useWallet, WalletConnectors } from 'wallets/wallet';
import LedgerDerivationPathModal from 'wallets/components/ledger-deriviation-path-modal';
import useMergeState from 'hooks/useMergeState';

import Modal, { ModalProps } from 'components/antd/modal';
import { Heading } from 'components/custom/typography';
import Button from 'components/antd/button';

import s from './styles.module.css';

export type ConnectWalletModalProps = ModalProps & {};

type ConnectWalletModalState = {
  showLedgerDerivationPathModal: boolean;
};

const InitialState: ConnectWalletModalState = {
  showLedgerDerivationPathModal: false,
};

const ConnectWalletModal: React.FunctionComponent<ConnectWalletModalProps> = props => {
  const { ...modalProps } = props;

  const wallet = useWallet();
  const [state, setState] = useMergeState<ConnectWalletModalState>(InitialState);

  function handleConnectorSelect(connector: WalletConnector) {
    if (wallet.isActive) {
      return;
    }

    if (connector.id === 'ledger') {
      return setState({ showLedgerDerivationPathModal: true });
    }

    return wallet.connect(connector);
  }

  return (
    <Modal className={s.component} width={568} {...modalProps}>
      <Heading type="h2" bold className={s.headerLabel}>
        Connect Wallet
      </Heading>
      <div className={s.list}>
        {WalletConnectors.map(connector => (
          <Button
            key={connector.id}
            type="link"
            className={s.btn}
            onClick={() => handleConnectorSelect(connector)}>
            <img src={connector.logo} alt={connector.name} className={s.logo} />
          </Button>
        ))}
      </div>

      {state.showLedgerDerivationPathModal && (
        <LedgerDerivationPathModal
          visible
          onCancel={() => {
            setState({ showLedgerDerivationPathModal: false });
          }}
        />
      )}
    </Modal>
  );
};

export default ConnectWalletModal;
