import React from 'react';
import BigNumber from 'bignumber.js';

import { useReload } from 'hooks/useReload';
import { useAsyncEffect } from 'hooks/useAsyncEffect';
import { useWallet } from 'wallets/wallet';
import { getHumanValue, ZERO_BIG_NUMBER } from 'web3/utils';
import Web3Contract from 'web3/contract';
import { UNIXTokenMeta } from 'web3/contracts/unix';

export const CONTRACT_YIELD_FARM_UNIX_ADDR_V2 = String(
  process.env.REACT_APP_CONTRACT_YIELD_FARM_UNIX_ADDR_V2,
);

type YieldFarmUNIXContractData = {
  isEnded?: boolean;
  delayedEpochs?: number;
  totalEpochs?: number;
  totalReward?: BigNumber;
  epochReward?: BigNumber;
  currentEpoch?: number;
  epochForPoolCalc?: number;
  unixReward?: BigNumber;
  poolSize?: BigNumber;
  nextPoolSize?: BigNumber;
  epochStake?: BigNumber;
  nextEpochStake?: BigNumber;
  currentReward?: BigNumber;
  potentialReward?: BigNumber;
};

export type YieldFarmUNIXContractV2 = YieldFarmUNIXContractData & {
  contract: Web3Contract;
  massHarvestSend: () => void;
  reload: () => void;
};

const InitialData: YieldFarmUNIXContractData = {
  isEnded: undefined,
  delayedEpochs: undefined,
  totalEpochs: undefined,
  totalReward: undefined,
  epochReward: undefined,
  currentEpoch: undefined,
  epochForPoolCalc: undefined,
  unixReward: undefined,
  poolSize: undefined,
  nextPoolSize: undefined,
  epochStake: undefined,
  nextEpochStake: undefined,
  currentReward: undefined,
  potentialReward: undefined,
};

export function useYieldFarmUNIXContractV2(): YieldFarmUNIXContractV2 {
  const [reload] = useReload();
  const wallet = useWallet();

  const contract = React.useMemo<Web3Contract>(() => {
    return new Web3Contract(
      require('web3/abi/yield_farm_unix_v2.json'),
      CONTRACT_YIELD_FARM_UNIX_ADDR_V2,
      'YIELD_FARM_UNIX_V2',
    );
  }, []);

  const [data, setData] = React.useState<YieldFarmUNIXContractData>(
    InitialData,
  );

  useAsyncEffect(async () => {
    let [
      delayedEpochs,
      totalEpochs,
      totalReward,
      currentEpoch,
    ] = await contract.batch([
      {
        method: 'EPOCHS_DELAYED_FROM_STAKING_CONTRACT',
        transform: (value: string) => Number(value),
      },
      {
        method: 'NR_OF_EPOCHS',
        transform: (value: string) => Number(value),
      },
      {
        method: 'TOTAL_DISTRIBUTED_AMOUNT',
        transform: (value: string) => new BigNumber(value),
      },
      {
        method: 'getCurrentEpoch',
        transform: (value: string) => Number(value),
      },
    ]);

    const isEnded = currentEpoch > totalEpochs;

    const epochForPoolCalc = currentEpoch
    currentEpoch = Math.min(currentEpoch, totalEpochs);

    const epochReward =
      totalEpochs !== 0 ? totalReward?.div(totalEpochs) : ZERO_BIG_NUMBER;

    let unixReward = ZERO_BIG_NUMBER;

    if (currentEpoch > 0) {
      const unixEpoch =
        currentEpoch === totalEpochs ? currentEpoch : currentEpoch - 1;
      unixReward = epochReward.multipliedBy(unixEpoch);
    }

    setData(prevState => ({
      ...prevState,
      isEnded,
      delayedEpochs,
      totalEpochs,
      totalReward,
      epochReward,
      currentEpoch,
      epochForPoolCalc,
      unixReward,
    }));

    const [poolSize, nextPoolSize] = await contract.batch([
      {
        method: 'getPoolSize',
        methodArgs: [epochForPoolCalc],
        transform: (value: string) =>
          getHumanValue(new BigNumber(value), UNIXTokenMeta.decimals),
      },
      {
        method: 'getPoolSize',
        methodArgs: [epochForPoolCalc + 1],
        transform: (value: string) =>
          getHumanValue(new BigNumber(value), UNIXTokenMeta.decimals),
      },
    ]);

    setData(prevState => ({
      ...prevState,
      poolSize,
      nextPoolSize,
    }));
  }, [reload]);

  useAsyncEffect(async () => {
    const { epochForPoolCalc } = data;

    let epochStake: BigNumber | undefined;
    let nextEpochStake: BigNumber | undefined;
    let currentReward: BigNumber | undefined;

    if (wallet.account && epochForPoolCalc !== undefined) {
      [epochStake, nextEpochStake, currentReward] = await contract.batch([
        {
          method: 'getEpochStake',
          methodArgs: [wallet.account, epochForPoolCalc],
          transform: (value: string) =>
            getHumanValue(new BigNumber(value), UNIXTokenMeta.decimals),
        },
        {
          method: 'getEpochStake',
          methodArgs: [wallet.account, epochForPoolCalc + 1],
          transform: (value: string) =>
            getHumanValue(new BigNumber(value), UNIXTokenMeta.decimals),
        },
        {
          method: 'massHarvest',
          callArgs: { from: wallet.account },
          transform: (value: string) =>
            getHumanValue(new BigNumber(value), UNIXTokenMeta.decimals),
        },
      ]);
    }

    setData(prevState => ({
      ...prevState,
      epochStake,
      nextEpochStake,
      currentReward,
    }));
  }, [reload, wallet.account, data.epochForPoolCalc]);

  useAsyncEffect(async () => {
    const { epochStake, poolSize, epochReward } = data;

    let potentialReward: BigNumber | undefined;

    if (
      epochStake !== undefined &&
      poolSize !== undefined &&
      epochReward !== undefined
    ) {
      if (poolSize.isEqualTo(ZERO_BIG_NUMBER)) {
        potentialReward = ZERO_BIG_NUMBER;
      } else {
        potentialReward = epochStake.div(poolSize).multipliedBy(epochReward);
      }
    }
    setData(prevState => ({
      ...prevState,
      potentialReward,
    }));
  }, [reload, data.epochStake, data.poolSize, data.epochReward]);

  const massHarvestSend = React.useCallback(() => {
    if (!wallet.account) {
      return Promise.reject();
    }

    return contract
      .send('massHarvest', [], {
        from: wallet.account,
      })
      .then(reload);
  }, [reload, contract, wallet.account]);

  return React.useMemo<YieldFarmUNIXContractV2>(
    () => ({
      ...data,
      contract,
      reload,
      massHarvestSend,
    }),
    [data, contract, reload, massHarvestSend],
  );
}
