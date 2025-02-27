import classNames from 'classnames'
import {
  ProgramAccount,
  RealmConfigAccount,
  TokenOwnerRecord,
  Realm,
  Proposal,
} from '@solana/spl-governance'
import { AccountInfo, MintInfo } from '@solana/spl-token'
import type { PublicKey } from '@solana/web3.js'
import { GoverningTokenRole } from '@solana/spl-governance'

import { TokenProgramAccount } from '@utils/tokens'
import useRealm from '@hooks/useRealm'
import {
  heliumVsrPluginsPks,
  nftPluginsPks,
  vsrPluginsPks,
} from '@hooks/useVotingPlugins'
import useProposal from '@hooks/useProposal'
import useWalletStore from 'stores/useWalletStore'

import CommunityVotingPower from './CommunityVotingPower'
import CouncilVotingPower from './CouncilVotingPower'
import LockedCommunityVotingPower from './LockedCommunityVotingPower'
import LockedCouncilVotingPower from './LockedCouncilVotingPower'
import NftVotingPower from './NftVotingPower'
import LockedCommunityNFTRecordVotingPower from './LockedCommunityNFTRecordVotingPower'

enum Type {
  Council,
  LockedCouncil,
  LockedCommunity,
  NFT,
  Community,
  LockedCommunityNFTRecord,
}

function getTypes(
  config?: ProgramAccount<RealmConfigAccount>,
  councilMint?: MintInfo,
  councilTokenAccount?: TokenProgramAccount<AccountInfo>,
  mint?: MintInfo,
  ownCouncilTokenRecord?: ProgramAccount<TokenOwnerRecord>,
  ownTokenRecord?: ProgramAccount<TokenOwnerRecord>,
  proposal?: ProgramAccount<Proposal>,
  realm?: ProgramAccount<Realm>,
  tokenRole?: GoverningTokenRole
) {
  const types: Type[] = []

  const currentPluginPk = config?.account?.communityTokenConfig.voterWeightAddin
  const isDepositVisible = (
    depositMint: MintInfo | undefined,
    realmMint: PublicKey | undefined
  ) =>
    depositMint &&
    (!proposal ||
      proposal.account.governingTokenMint.toBase58() === realmMint?.toBase58())

  if (
    currentPluginPk &&
    nftPluginsPks.includes(currentPluginPk.toBase58()) &&
    tokenRole === GoverningTokenRole.Community
  ) {
    types.push(Type.NFT)
  } else if (
    currentPluginPk &&
    vsrPluginsPks.includes(currentPluginPk.toBase58())
  ) {
    if (
      (!realm?.account.config.councilMint ||
        isDepositVisible(mint, realm?.account.communityMint)) &&
      tokenRole === GoverningTokenRole.Community
    ) {
      types.push(Type.LockedCommunity)
    } else if (
      isDepositVisible(councilMint, realm?.account.config.councilMint) &&
      tokenRole === GoverningTokenRole.Council
    ) {
      types.push(Type.LockedCouncil)
    }
  } else if (
    currentPluginPk &&
    heliumVsrPluginsPks.includes(currentPluginPk.toBase58())
  ) {
    if (
      (!realm?.account.config.councilMint ||
        isDepositVisible(mint, realm?.account.communityMint)) &&
      tokenRole === GoverningTokenRole.Community
    ) {
      types.push(Type.LockedCommunityNFTRecord)
    } else if (
      isDepositVisible(councilMint, realm?.account.config.councilMint) &&
      tokenRole === GoverningTokenRole.Council
    ) {
      types.push(Type.Council)
    }
  } else if (tokenRole === GoverningTokenRole.Council) {
    types.push(Type.Council)
  } else if (tokenRole === GoverningTokenRole.Community) {
    types.push(Type.Community)
  }

  return types
}

interface Props {
  className?: string
}

export default function VotingPower(props: Props) {
  const { proposal } = useProposal()
  const {
    config,
    councilMint,
    councilTokenAccount,
    mint,
    ownCouncilTokenRecord,
    ownTokenRecord,
    realm,
  } = useRealm()
  const connected = useWalletStore((s) => s.connected)
  const tokenRole = useWalletStore((s) => s.selectedProposal.tokenRole)

  const types = getTypes(
    config,
    councilMint,
    councilTokenAccount,
    mint,
    ownCouncilTokenRecord,
    ownTokenRecord,
    proposal,
    realm,
    tokenRole
  )

  if (!connected || !proposal) {
    return (
      <div
        className={classNames(props.className, 'rounded-md bg-bkg-1 h-[76px]')}
      />
    )
  }

  if (connected && types.length === 0) {
    return (
      <div className={classNames(props.className, 'text-xs', 'text-white/50')}>
        You do not have any voting power in this dao.
      </div>
    )
  }

  return (
    <div className={classNames(props.className, 'space-y-2')}>
      {types.map((type) => {
        switch (type) {
          case Type.Council:
            return <CouncilVotingPower key={type} />
          case Type.LockedCommunity:
            return <LockedCommunityVotingPower key={type} />
          case Type.LockedCouncil:
            return <LockedCouncilVotingPower key={type} />
          case Type.Community:
            return <CommunityVotingPower key={type} />
          case Type.NFT:
            return <NftVotingPower key={type} />
          case Type.LockedCommunityNFTRecord:
            return <LockedCommunityNFTRecordVotingPower key={type} />
        }
      })}
    </div>
  )
}
