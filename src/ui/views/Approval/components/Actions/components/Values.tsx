import React, { useMemo, ReactNode } from 'react';
import { message } from 'antd';
import styled from 'styled-components';
import ClipboardJS from 'clipboard';
import { Chain } from 'background/service/openapi';
import AddressMemo from './AddressMemo';
import userDataDrawer from './UserListDrawer';
import { useWallet } from 'ui/utils';
import { getTimeSpan } from 'ui/utils/time';
import { formatUsdValue, formatAmount } from 'ui/utils/number';
import LogoWithText from './LogoWithText';
import { ellipsis } from '@/ui/utils/address';
import { openInTab } from '@/ui/utils';
import IconEdit from 'ui/assets/editpen.svg';
import IconSuccess from 'ui/assets/success.svg';
import IconScam from 'ui/assets/sign/tx/token-scam.svg';
import IconFake from 'ui/assets/sign/tx/token-fake.svg';
import IconAddressCopy from 'ui/assets/icon-copy-2.svg';
import IconExternal from 'ui/assets/icon-share.svg';
import { TooltipWithMagnetArrow } from '@/ui/component/Tooltip/TooltipWithMagnetArrow';

const Boolean = ({ value }: { value: boolean }) => {
  return <>{value ? 'Yes' : 'No'}</>;
};

const TokenAmountWrapper = styled.div`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;
const TokenAmount = ({ value }: { value: string | number }) => {
  return <TokenAmountWrapper>{formatAmount(value)}</TokenAmountWrapper>;
};

const Percentage = ({ value }: { value: number }) => {
  return <>{(value * 100).toFixed(2)}%</>;
};

const USDValue = ({ value }: { value: number | string }) => {
  return <Text>{formatUsdValue(value)}</Text>;
};

const TimeSpan = ({ value }: { value: number | null }) => {
  const timeSpan = useMemo(() => {
    const bornAt = value;
    if (!bornAt) return '-';
    const { d, h, m } = getTimeSpan(Math.floor(Date.now() / 1000) - bornAt);
    if (d > 0) {
      return `${d} Day${d > 1 ? 's' : ''} ago`;
    }
    if (h > 0) {
      return `${h} Hour${h > 1 ? 's' : ''} ago`;
    }
    if (m > 1) {
      return `${m} Minutes ago`;
    }
    return '1 Minute ago';
  }, [value]);
  return <>{timeSpan}</>;
};

const AddressMarkWrapper = styled.div`
  display: inline-flex;
  cursor: pointer;
  .icon-edit-alias {
    width: 13px;
    height: 13px;
  }
`;
const AddressMark = ({
  onWhitelist,
  onBlacklist,
  address,
  chain,
  isContract = false,
  onChange,
}: {
  onWhitelist: boolean;
  onBlacklist: boolean;
  address: string;
  chain: Chain;
  isContract?: boolean;
  onChange(): void;
}) => {
  const chainId = chain.serverId;
  const wallet = useWallet();
  const handleEditMark = () => {
    userDataDrawer({
      address: address,
      chain,
      onWhitelist,
      onBlacklist,
      async onChange(data) {
        if (data.onWhitelist && !onWhitelist) {
          if (isContract && chainId) {
            await wallet.addContractWhitelist({
              address,
              chainId,
            });
          } else {
            await wallet.addAddressWhitelist(address);
          }
          message.success({
            duration: 3,
            icon: <i />,
            content: (
              <div>
                <div className="flex gap-4">
                  <img src={IconSuccess} alt="" />
                  <div className="text-white">Mark as "Trusted"</div>
                </div>
              </div>
            ),
          });
        }
        if (data.onBlacklist && !onBlacklist) {
          if (isContract && chainId) {
            await wallet.addContractBlacklist({
              address,
              chainId,
            });
          } else {
            await wallet.addAddressBlacklist(address);
          }
          message.success({
            duration: 3,
            icon: <i />,
            content: (
              <div>
                <div className="flex gap-4">
                  <img src={IconSuccess} alt="" />
                  <div className="text-white">Mark as "Blocked"</div>
                </div>
              </div>
            ),
          });
        }
        if (
          !data.onBlacklist &&
          !data.onWhitelist &&
          (onBlacklist || onWhitelist)
        ) {
          if (isContract && chainId) {
            await wallet.removeContractBlacklist({
              address,
              chainId,
            });
            await wallet.removeContractWhitelist({
              address,
              chainId,
            });
          } else {
            await wallet.removeAddressBlacklist(address);
            await wallet.removeAddressWhitelist(address);
          }
          message.success({
            duration: 3,
            icon: <i />,
            content: (
              <div>
                <div className="flex gap-4">
                  <img src={IconSuccess} alt="" />
                  <div className="text-white">Mark removed</div>
                </div>
              </div>
            ),
          });
        }
        onChange();
      },
    });
  };
  return (
    <AddressMarkWrapper onClick={handleEditMark}>
      <span className="mr-6">
        {onWhitelist && 'Trusted'}
        {onBlacklist && 'Blocked'}
        {!onBlacklist && !onWhitelist && 'No mark'}
      </span>
      <img src={IconEdit} className="icon-edit-alias icon" />
    </AddressMarkWrapper>
  );
};

const Protocol = ({
  value,
  logoSize,
  textStyle,
}: {
  value?: { name: string; logo_url: string } | null;
  logoSize?: number;
  textStyle?: React.CSSProperties;
}) => {
  return (
    <>
      {value ? (
        <LogoWithText
          logo={value.logo_url}
          text={value.name}
          logoRadius="100%"
          logoSize={logoSize}
          textStyle={textStyle}
        />
      ) : (
        '-'
      )}
    </>
  );
};

const TokenLabel = ({
  isScam,
  isFake,
}: {
  isScam: boolean;
  isFake: boolean;
}) => {
  return (
    <div className="flex gap-4 shrink-0 relative">
      {isFake && (
        <TooltipWithMagnetArrow
          overlayClassName="rectangle w-[max-content]"
          title="This is a scam token marked by Rabby"
        >
          <img src={IconFake} className="icon icon-fake w-12" />
        </TooltipWithMagnetArrow>
      )}
      {isScam && (
        <TooltipWithMagnetArrow
          overlayClassName="rectangle w-[max-content]"
          title="This is potentially a low-quality and scam token based on Rabby's detection"
        >
          <img src={IconScam} className="icon icon-scam w-14" />
        </TooltipWithMagnetArrow>
      )}
    </div>
  );
};

const AddressWrapper = styled.div`
  display: flex;
  .icon-copy {
    opacity: 0;
  }
  &:hover {
    .icon-copy {
      opacity: 1;
    }
  }
`;
const Address = ({
  address,
  chain,
  iconWidth = '12px',
}: {
  address: string;
  chain: Chain;
  iconWidth?: string;
}) => {
  const handleClickContractId = () => {
    openInTab(chain.scanLink.replace(/tx\/_s_/, `address/${address}`), false);
  };
  const handleCopyContractAddress = () => {
    const clipboard = new ClipboardJS('.value-address', {
      text: function () {
        return address;
      },
    });

    clipboard.on('success', () => {
      message.success({
        duration: 3,
        icon: <i />,
        content: (
          <div>
            <div className="flex gap-4 mb-4">
              <img src={IconSuccess} alt="" />
              Copied
            </div>
            <div className="text-white">{address}</div>
          </div>
        ),
      });
      clipboard.destroy();
    });
  };
  return (
    <AddressWrapper className="value-address">
      <span title={address}>{ellipsis(address)}</span>
      <img
        onClick={handleClickContractId}
        src={IconExternal}
        width={iconWidth}
        height={iconWidth}
        className="ml-6 cursor-pointer"
      />
      <img
        onClick={handleCopyContractAddress}
        src={IconAddressCopy}
        width={iconWidth}
        height={iconWidth}
        className="ml-6 cursor-pointer icon-copy"
      />
    </AddressWrapper>
  );
};

const Text = ({ children }: { children: ReactNode }) => {
  return (
    <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
      {children}
    </div>
  );
};

export {
  Boolean,
  TokenAmount,
  Percentage,
  AddressMemo,
  AddressMark,
  USDValue,
  TimeSpan,
  Protocol,
  TokenLabel,
  Address,
  Text,
};
