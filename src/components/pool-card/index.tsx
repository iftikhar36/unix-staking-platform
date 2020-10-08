import React from 'react';
import * as Antd from 'antd';

import InfoTooltip from 'components/info-tooltip';
import IconsSet from 'components/icons-set';

import { formatBigValue } from 'web3/utils';
import { useWeb3Contracts } from 'web3/contracts';

import { ReactComponent as USDCIcon } from 'resources/svg/tokens/usdc.svg';
import { ReactComponent as DAIIcon } from 'resources/svg/tokens/dai.svg';
import { ReactComponent as SUSDIcon } from 'resources/svg/tokens/susd.svg';
import { ReactComponent as UNIIcon } from 'resources/svg/tokens/uniswap.svg';

import s from './styles.module.css';

export type PoolCardProps = {
  stableToken?: boolean;
  lpToken?: boolean;
  onStaking: () => void;
};

type TokenBalanceShare = {
  icon: React.ReactNode;
  name: string;
  value: string;
  share: number;
  color: string;
};

const PoolCard: React.FunctionComponent<PoolCardProps> = props => {
  const { yf, yflp, staking } = useWeb3Contracts();

  const { stableToken = false, lpToken = false } = props;

  const icons = React.useMemo<React.ReactNode[]>(() => {
    if (stableToken) {
      return [
        <USDCIcon key="usdc" />,
        <DAIIcon key="dai" />,
        <SUSDIcon key="susd" />,
      ];
    } else if (lpToken) {
      return [
        <UNIIcon key="uniswap" />,
      ];
    }

    return [];
  }, [stableToken, lpToken]);

  const nameLabel = React.useMemo<string>(() => {
    if (stableToken) {
      return 'USDC/DAI/sUSD';
    } else if (lpToken) {
      return 'USDC_BOND_UNI_LP';
    }

    return '-';
  }, [stableToken, lpToken]);

  const epochLabel = React.useMemo<string>(() => {
    if (stableToken) {
      return `EPOCH ${yf.currentEpoch ?? '-'}/${yf.totalEpochs ?? '-'}`;
    } else if (lpToken) {
      return `EPOCH ${yflp.currentEpoch ?? '-'}/${yflp.totalEpochs ?? '-'}`;
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const epochReward = React.useMemo<string>(() => {
    if (stableToken) {
      return `${formatBigValue(yf.epochReward)} BOND`;
    } else if (lpToken) {
      return `${formatBigValue(yflp.epochReward)} BOND`;
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const potentialReward = React.useMemo<string>(() => {
    if (stableToken) {
      return `${formatBigValue(yf.potentialReward)} BOND`;
    } else if (lpToken) {
      return `${formatBigValue(yflp.potentialReward)} BOND`;
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const balance = React.useMemo<string>(() => {
    if (stableToken) {
      return `$ ${formatBigValue(yf.nextPoolSize)}`;
    } else if (lpToken) {
      return `${formatBigValue(yflp.nextPoolSize)} USDC_BOND_UNI_LP`;
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const effectiveBalance = React.useMemo<string>(() => {
    if (stableToken) {
      return `$ ${formatBigValue(yf.poolSize)}`;
    } else if (lpToken) {
      return formatBigValue(yflp.poolSize);
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const balanceShares = React.useMemo<TokenBalanceShare[]>(() => {
    const shares: TokenBalanceShare[] = [];

    if (stableToken) {
      if (yf.nextPoolSize) {
        const usdcShare = staking.usdc.nextEpochPoolSize
          ?.multipliedBy(100)
          .div(yf.nextPoolSize)
          .toNumber();

        if (usdcShare) {
          shares.push({
            icon: <USDCIcon />,
            name: 'USDC',
            value: `$ ${formatBigValue(staking.usdc.nextEpochPoolSize)}`,
            share: usdcShare,
            color: '#4f6ae6',
          });
        }

        const daiShare = staking.dai.nextEpochPoolSize
          ?.multipliedBy(100)
          .div(yf.nextPoolSize)
          .toNumber();

        if (daiShare) {
          shares.push({
            icon: <DAIIcon />,
            name: 'DAI',
            value: `$ ${formatBigValue(staking.dai.nextEpochPoolSize)}`,
            share: daiShare,
            color: '#ffd160',
          });
        }

        const susdShare = staking.susd.nextEpochPoolSize
          ?.multipliedBy(100)
          .div(yf.nextPoolSize)
          .toNumber() ?? 0;

        if (susdShare) {
          shares.push({
            icon: <SUSDIcon />,
            name: 'SUSD',
            value: `$ ${formatBigValue(staking.susd.nextEpochPoolSize)}`,
            share: susdShare,
            color: '#1e1a31',
          });
        }
      }
    } else if (lpToken) {
      if (yflp.nextPoolSize) {
        const uniShare = staking.uniswap_v2.nextEpochPoolSize
          ?.multipliedBy(100)
          .div(yflp.nextPoolSize)
          .toNumber();

        if (uniShare) {
          shares.push({
            icon: <UNIIcon />,
            name: 'USDC_BOND_UNI_LP',
            value: `${formatBigValue(staking.uniswap_v2.nextEpochPoolSize)} USDC_BOND_UNI_LP`,
            share: uniShare,
            color: '#ff4339',
          });
        }
      }
    }

    return shares;
  }, [stableToken, lpToken, yf, yflp, staking]);

  const myBalance = React.useMemo<string>(() => {
    if (stableToken) {
      return `$ ${formatBigValue(yf.nextEpochStake)}`;
    } else if (lpToken) {
      return `${formatBigValue(yflp.nextEpochStake)} USDC_BOND_UNI_LP`;
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const myEffectiveBalance = React.useMemo<string>(() => {
    if (stableToken) {
      return `$ ${formatBigValue(yf.epochStake)}`;
    } else if (lpToken) {
      return formatBigValue(yflp.epochStake);
    }

    return '-';
  }, [stableToken, lpToken, yf, yflp]);

  const myBalanceShares = React.useMemo<TokenBalanceShare[]>(() => {
    const shares: TokenBalanceShare[] = [];

    if (stableToken) {
      if (yf.nextEpochStake) {
        const usdcShare = staking.usdc.nextEpochUserBalance
          ?.multipliedBy(100)
          .div(yf.nextEpochStake)
          .toNumber();

        if (usdcShare) {
          shares.push({
            icon: <USDCIcon />,
            name: 'USDC',
            value: `$ ${formatBigValue(staking.usdc.nextEpochUserBalance)}`,
            share: usdcShare,
            color: '#4f6ae6',
          });
        }

        const daiShare = staking.dai.nextEpochUserBalance
          ?.multipliedBy(100)
          .div(yf.nextEpochStake)
          .toNumber();

        if (daiShare) {
          shares.push({
            icon: <DAIIcon />,
            name: 'DAI',
            value: `$ ${formatBigValue(staking.dai.nextEpochUserBalance)}`,
            share: daiShare,
            color: '#ffd160',
          });
        }

        const susdShare = staking.susd.nextEpochUserBalance
          ?.multipliedBy(100)
          .div(yf.nextEpochStake)
          .toNumber() ?? 0;

        if (susdShare) {
          shares.push({
            icon: <SUSDIcon />,
            name: 'SUSD',
            value: `$ ${formatBigValue(staking.susd.nextEpochUserBalance)}`,
            share: susdShare,
            color: '#1e1a31',
          });
        }
      }
    } else if (lpToken) {
      if (yflp.nextEpochStake) {
        const uniShare = staking.uniswap_v2.nextEpochUserBalance
          ?.multipliedBy(100)
          .div(yflp.nextEpochStake)
          .toNumber();

        if (uniShare) {
          shares.push({
            icon: <UNIIcon />,
            name: 'USDC_BOND_UNI_LP',
            value: `${formatBigValue(staking.uniswap_v2.nextEpochUserBalance)} USDC_BOND_UNI_LP`,
            share: uniShare,
            color: '#ff4339',
          });
        }
      }
    }

    return shares;
  }, [stableToken, lpToken, yf, yflp, staking]);

  return (
    <div className={s.component}>
      <div className={s.row1}>
        <IconsSet className={s.pool_avatars} icons={icons} />
        <div className={s.pool_info}>
          <div className={s.pool_label}>{nameLabel}</div>
          <div className={s.pool_epoch}>{epochLabel}</div>
        </div>
        <Antd.Button className={s.stakingBtn} type="primary" onClick={props.onStaking}>Staking</Antd.Button>
      </div>

      <div className={s.row2}>
        <div className={s.col1}>
          <div className={s.row_label}>REWARD</div>
          <div className={s.row_value}>
            <span>{epochReward}</span>
          </div>
        </div>
        <div className={s.col2}>
          <div className={s.row_label}>MY POTENTIAL REWARD</div>
          <div className={s.row_value}>
            <span>{potentialReward}</span>
          </div>
        </div>
      </div>

      <div className={s.row3}>
        <div className={s.row_label}>
          <span>POOL BALANCE</span>
          <InfoTooltip />
        </div>
        <div className={s.row_value}>{balance}</div>
        <div className={s.row_value_2}>{effectiveBalance} effective balance</div>
        <div className={s.pool_stack_bar}>
          {balanceShares.map((tokenShare, index) => (
            <Antd.Tooltip key={index} placement="top" title={(
              <div className={s.balance_tooltip}>
                <div>{tokenShare.icon}</div>
                <span>{tokenShare.name}:</span>
                <span>{tokenShare.value}</span>
              </div>
            )}>
              <div style={{ width: `${tokenShare.share}%`, backgroundColor: tokenShare.color }} />
            </Antd.Tooltip>
          ))}
        </div>
      </div>

      <div className={s.row4}>
        <div className={s.row_label}>
          <span>MY BALANCE</span>
          <InfoTooltip />
        </div>
        <div className={s.row_value}>{myBalance}</div>
        <div className={s.row_value_2}>{myEffectiveBalance} effective balance</div>
        <div className={s.pool_stack_bar}>
          {myBalanceShares.map((tokenShare, index) => (
            <Antd.Tooltip key={index} placement="top" title={(
              <div className={s.balance_tooltip}>
                <div>{tokenShare.icon}</div>
                <span>{tokenShare.name}:</span>
                <span>{tokenShare.value}</span>
              </div>
            )}>
              <div style={{ width: `${tokenShare.share}%`, backgroundColor: tokenShare.color }} />
            </Antd.Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PoolCard;
