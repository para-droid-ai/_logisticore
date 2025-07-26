import { GameState, PlayerId, DoctrineEffect, NodeData, Faction, NodeType } from '../types';
import { ATTRITION_COST_STANDARD_UNIT_MAT, FORT_REPAIR_MAT_COST_PER_HP, FORT_UPGRADE_LEVEL_MAT_COST, RECON_PULSE_COST_QR, RECON_PULSE_COST_MAT, MAX_FORTIFICATION_LEVEL, MAX_ARTILLERY_PER_NODE, ATTRITION_COST_ARTILLERY_QR, ATTRITION_COST_ARTILLERY_MAT_CREATION, ATTRITION_AMMO_COST_ARTILLERY_STRIKE, ATTRITION_COST_INFILTRATOR_MAT, MAX_INFILTRATORS_PER_NODE_FROM_ONE_FACTION, BATTLE_PROMOTION_RATIO, UNITS_REINFORCED_PER_NODE, SABOTAGE_IH_OUTPUT_REDUCTION_FACTOR, FORT_HP_PER_LEVEL, ARTILLERY_STRIKE_FORT_HP_DAMAGE_PER_GUN, ATTRITION_UPKEEP_STANDARD, ATTRITION_UPKEEP_FORTRESS, RECON_ARRAY_UPKEEP_MAT, ATTRITION_COST_ARTILLERY_MOVE_MAT_PER_PIECE } from '../../../constants';

export const applyDoctrineEffects = (gameState: GameState, factionId: PlayerId, effect: DoctrineEffect): GameState => {
    let newGameState = { ...gameState };
    let faction = { ...newGameState.factions[factionId] };

    switch (effect.type) {
        case 'GAIN_MAT':
            if (effect.value) {
                faction.MAT += effect.value;
            }
            break;
        case 'FLAT_MAT_INCOME':
            if (effect.value) {
                faction.flatMATIncomeBonus = (faction.flatMATIncomeBonus || 0) + effect.value;
            }
            break;
        case 'FLAT_QR_INCOME':
            if (effect.value) {
                faction.flatQRIncomeBonus = (faction.flatQRIncomeBonus || 0) + effect.value;
            }
            break;
        case 'PERCENTAGE_MAT_INCOME_MODIFIER':
            if (effect.value) {
                faction.percentageMATIncomeModifier = (faction.percentageMATIncomeModifier || 0) + effect.value;
            }
            break;
        case 'PERCENTAGE_QR_INCOME_MODIFIER':
            if (effect.value) {
                faction.percentageQRIncomeModifier = (faction.percentageQRIncomeModifier || 0) + effect.value;
            }
            break;
        case 'UNIT_UPKEEP_MODIFIER':
            if (effect.value) {
                faction.unitUpkeepModifier = (faction.unitUpkeepModifier || 0) + effect.value;
            }
            break;
        case 'UNIT_DEPLOY_COST_MODIFIER':
            if (effect.value) {
                faction.unitDeployCostModifier = (faction.unitDeployCostModifier || 0) + effect.value;
            }
            break;
        case 'COMBAT_ROLL_MODIFIER':
            if (effect.value) {
                faction.combatRollModifier = (faction.combatRollModifier || 0) + effect.value;
            }
            break;
        case 'MAX_UNIT_CAPACITY_MODIFIER':
            if (effect.value) {
                for (const nodeId in newGameState.mapNodes) {
                    const node = newGameState.mapNodes[nodeId];
                    if (node.owner === factionId) {
                        node.maxUnits = Math.max(0, node.maxUnits + effect.value);
                    }
                }
            }
            break;
        case 'FORTIFICATION_COST_MODIFIER':
            if (effect.value) {
                faction.fortificationCostModifier = (faction.fortificationCostModifier || 0) + effect.value;
            }
            break;
        case 'FORTIFICATION_HP_MODIFIER':
            if (effect.value) {
                for (const nodeId in newGameState.mapNodes) {
                    const node = newGameState.mapNodes[nodeId];
                    if (node.owner === factionId) {
                        node.fortificationHPModifier = (node.fortificationHPModifier || 0) + effect.value;
                    }
                }
            }
            break;
        case 'FORTIFICATION_COMBAT_BONUS_MODIFIER':
            if (effect.value) {
                faction.fortificationCombatBonusModifier = (faction.fortificationCombatBonusModifier || 0) + effect.value;
            }
            break;
        case 'ARTILLERY_COST_MODIFIER':
            if (effect.value) {
                faction.artilleryCostModifier = (faction.artilleryCostModifier || 0) + effect.value;
            }
            break;
        case 'ARTILLERY_RANGE_MODIFIER':
            if (effect.value) {
                faction.artilleryRangeModifier = (faction.artilleryRangeModifier || 0) + effect.value;
            }
            break;
        case 'ARTILLERY_DAMAGE_MODIFIER':
            if (effect.value) {
                faction.artilleryDamageModifier = (faction.artilleryDamageModifier || 0) + effect.value;
            }
            break;
        case 'RECON_COST_MODIFIER':
            if (effect.value) {
                faction.reconCostModifier = (faction.reconCostModifier || 0) + effect.value;
            }
            break;
        case 'RECON_PULSE_DURATION_MODIFIER':
            if (effect.value) {
                faction.reconPulseDurationModifier = (faction.reconPulseDurationModifier || 0) + effect.value;
            }
            break;
        case 'INFILTRATOR_COST_MODIFIER':
            if (effect.value) {
                faction.infiltratorCostModifier = (faction.infiltratorCostModifier || 0) + effect.value;
            }
            break;
        case 'INFILTRATOR_EFFECTIVENESS_MODIFIER':
            if (effect.value) {
                faction.infiltratorEffectivenessModifier = (faction.infiltratorEffectivenessModifier || 0) + effect.value;
            }
            break;
        case 'INFILTRATOR_DETECTION_MODIFIER':
            if (effect.value) {
                faction.infiltratorDetectionModifier = (faction.infiltratorDetectionModifier || 0) + effect.value;
            }
            break;
        case 'DISABLE_ACTION':
            if (effect.actionType) {
                if (!faction.disabledActions) {
                    faction.disabledActions = [];
                }
                faction.disabledActions.push(effect.actionType);
            }
            break;
        case 'GAIN_MAT_ON_CAPTURE':
            if (effect.value) {
                faction.gainMatOnCaptureModifier = (faction.gainMatOnCaptureModifier || 0) + effect.value;
            }
            break;
        case 'PERMANENT_NODE_MAT_REDUCTION_ON_CAPTURE':
            if (effect.value) {
                faction.permanentNodeMatReductionOnCapture = (faction.permanentNodeMatReductionOnCapture || 0) + effect.value;
            }
            break;
        case 'FREE_UNIT_PER_TURN':
            if (effect.value) {
                faction.freeUnitPerTurn = (faction.freeUnitPerTurn || 0) + effect.value;
            }
            break;
        case 'RESOURCE_CONVERSION':
            if (effect.conversionRatio) {
                faction.resourceConversion = effect.conversionRatio;
            }
            break;
        case 'DISABLE_RESOURCE_TYPE':
            if (effect.resourceType) {
                if (!faction.disabledResourceTypes) {
                    faction.disabledResourceTypes = [];
                }
                faction.disabledResourceTypes.push(effect.resourceType);
            }
            break;
        case 'BATTLE_REWARD_MAT':
            if (effect.value) {
                faction.battleRewardMat = (faction.battleRewardMat || 0) + effect.value;
            }
            break;
        case 'TEMPORARY_ACTION_COST_REDUCTION':
            if (effect.actionType && effect.value && effect.duration) {
                if (!faction.temporaryActionCostModifiers) {
                    faction.temporaryActionCostModifiers = [];
                }
                faction.temporaryActionCostModifiers.push({
                    actionType: effect.actionType,
                    value: effect.value,
                    turnsRemaining: effect.duration,
                    modifierType: 'PERCENTAGE_DECREASE'
                });
            }
            break;
        case 'TEMPORARY_ACTION_COST_INCREASE':
            if (effect.actionType && effect.value && effect.duration) {
                if (!faction.temporaryActionCostModifiers) {
                    faction.temporaryActionCostModifiers = [];
                }
                faction.temporaryActionCostModifiers.push({
                    actionType: effect.actionType,
                    value: effect.value,
                    turnsRemaining: effect.duration,
                    modifierType: 'PERCENTAGE_INCREASE'
                });
            }
            break;
        case 'MAX_CONTROLLED_NODE_TYPE_LIMIT':
            if (effect.nodeType && effect.maxLimit !== undefined) {
                if (!faction.maxControlledNodeTypeLimits) {
                    faction.maxControlledNodeTypeLimits = {};
                }
                faction.maxControlledNodeTypeLimits[effect.nodeType] = effect.maxLimit;
            }
            break;
        case 'COMBAT_ROLL_MODIFIER_CONDITIONAL':
            if (effect.value && effect.condition) {
                if (!faction.combatRollModifierConditional) {
                    faction.combatRollModifierConditional = [];
                }
                faction.combatRollModifierConditional.push({ value: effect.value, condition: effect.condition });
            }
            break;
        case 'MAT_INCOME_MODIFIER_FROM_NODE_TYPE':
            if (effect.nodeType && effect.value) {
                if (!faction.matIncomeModifierFromNodeType) {
                    faction.matIncomeModifierFromNodeType = {};
                }
                faction.matIncomeModifierFromNodeType[effect.nodeType] = (faction.matIncomeModifierFromNodeType[effect.nodeType] || 0) + effect.value;
            }
            break;
        case 'UNIT_DEPLOY_LIMIT':
            if (effect.value) {
                faction.unitDeployLimit = effect.value;
            }
            break;
        case 'ARTILLERY_SUPPORT_RANGE_MODIFIER':
            if (effect.value) {
                faction.artillerySupportRangeModifier = (faction.artillerySupportRangeModifier || 0) + effect.value;
            }
            break;
        case 'CN_MAX_UNIT_CAPACITY_MODIFIER':
            if (effect.value) {
                faction.cnMaxUnitCapacityModifier = (faction.cnMaxUnitCapacityModifier || 0) + effect.value;
            }
            break;
        case 'UNIT_UPKEEP_PERCENTAGE_INCREASE':
            if (effect.value) {
                faction.unitUpkeepPercentageIncrease = (faction.unitUpkeepPercentageIncrease || 0) + effect.value;
            }
            break;
        case 'UNIT_UPKEEP_PERCENTAGE_DECREASE':
            if (effect.value) {
                faction.unitUpkeepPercentageDecrease = (faction.unitUpkeepPercentageDecrease || 0) + effect.value;
            }
            break;
        case 'SUPPRESSION_INCREASE':
            if (effect.value) {
                for (const nodeId in newGameState.mapNodes) {
                    const node = newGameState.mapNodes[nodeId];
                    if (node.owner === factionId) {
                        node.suppression = (node.suppression || 0) + effect.value;
                    }
                }
            }
            break;
        case 'ENEMY_RECON_PULSE_FAILURE_CHANCE':
            if (effect.value) {
                faction.enemyReconPulseFailureChance = (faction.enemyReconPulseFailureChance || 0) + effect.value;
            }
            break;
        case 'ARTILLERY_FIRE_COST_MODIFIER':
            if (effect.value) {
                faction.artilleryFireCostModifier = (faction.artilleryFireCostModifier || 0) + effect.value;
            }
            break;
        case 'MOVE_UNITS_COST_MODIFIER':
            if (effect.value) {
                faction.moveUnitsCostModifier = (faction.moveUnitsCostModifier || 0) + effect.value;
            }
            break;
        case 'MOVE_UNITS_COST_PER_UNIT_MODIFIER':
            if (effect.value) {
                faction.moveUnitsCostPerUnitModifier = (faction.moveUnitsCostPerUnitModifier || 0) + effect.value;
            }
            break;
        case 'COMBAT_BONUS_NEUTRAL_TERRITORY':
            if (effect.value) {
                faction.combatBonusNeutralTerritory = (faction.combatBonusNeutralTerritory || 0) + effect.value;
            }
            break;
        case 'COMBAT_PENALTY_OWN_FORTRESS_DEFENSE':
            if (effect.value) {
                faction.combatPenaltyOwnFortressDefense = (faction.combatPenaltyOwnFortressDefense || 0) + effect.value;
            }
            break;
        case 'RECON_ARRAY_UPKEEP_MODIFIER':
            if (effect.value) {
                faction.reconArrayUpkeepModifier = (faction.reconArrayUpkeepModifier || 0) + effect.value;
            }
            break;
        case 'DECOY_RECON_PULSE':
            faction.decoyReconPulse = true;
            break;
        case 'PERMANENT_ENEMY_RESOURCE_VISIBILITY':
            faction.permanentEnemyResourceVisibility = true;
            break;
        case 'MAX_ACTIVE_RECON_ARRAY_LIMIT':
            if (effect.value) {
                faction.maxActiveReconArrayLimit = effect.value;
            }
            break;
        case 'TRAIN_INFILTRATOR_INSTANT':
            faction.canTrainInfiltratorInstant = true;
            break;
        case 'INFILTRATOR_UPKEEP_MODIFIER':
            if (effect.value) {
                faction.infiltratorUpkeepModifier = (faction.infiltratorUpkeepModifier || 0) + effect.value;
            }
            break;
        case 'INFILTRATOR_NEW_ACTION':
            faction.infiltratorNewAction = true;
            break;
        case 'ARTILLERY_STRIKE_FORT_HP_DAMAGE':
            if (effect.value) {
                faction.artilleryStrikeFortHPDamage = (faction.artilleryStrikeFortHPDamage || 0) + effect.value;
            }
            break;
        case 'ARTILLERY_STRIKE_OWN_UNIT_DAMAGE_CHANCE':
            if (effect.value) {
                faction.artilleryStrikeOwnUnitDamageChance = (faction.artilleryStrikeOwnUnitDamageChance || 0) + effect.value;
            }
            break;
        case 'MOVE_UNITS_TWO_NODES':
            faction.moveUnitsTwoNodes = true;
            break;
        case 'MOVE_UNITS_SUPPRESSION_PENALTY':
            if (effect.value) {
                faction.moveUnitsSuppressionPenalty = (faction.moveUnitsSuppressionPenalty || 0) + effect.value;
            }
            break;
        case 'ENEMY_UNIT_ATTRITION_ON_MOVE':
            if (effect.value) {
                faction.enemyUnitAttritionOnMove = (faction.enemyUnitAttritionOnMove || 0) + effect.value;
            }
            break;
        case 'DISABLE_NEUTRAL_NODE_CAPTURE_ADJACENT_ENEMY':
            faction.disableNeutralNodeCaptureAdjacentEnemy = true;
            break;
        case 'BATTLEFIELD_PROMOTION_MODIFIER':
            if (effect.value) {
                faction.battlefieldPromotionModifier = (faction.battlefieldPromotionModifier || 0) + effect.value;
            }
            break;
        case 'DISABLE_AUTO_REINFORCEMENTS':
            faction.disableAutoReinforcements = true;
            break;
        case 'MOVE_UNITS_FROM_CN_TO_ANY_NODE':
            faction.moveUnitsFromCNToAnyNode = true;
            break;
        case 'MOVE_UNITS_CN_COST_MODIFIER':
            if (effect.value) {
                faction.moveUnitsCNCostModifier = (faction.moveUnitsCNCostModifier || 0) + effect.value;
            }
            break;
        case 'MAX_UNIT_CAPACITY_NON_CN_MODIFIER':
            if (effect.value) {
                faction.maxUnitCapacityNonCNModifier = (faction.maxUnitCapacityNonCNModifier || 0) + effect.value;
            }
            break;
        case 'AUTO_REINFORCEMENT_RATE_MODIFIER':
            if (effect.value) {
                faction.autoReinforcementRateModifier = (faction.autoReinforcementRateModifier || 0) + effect.value;
            }
            break;
        case 'IMMUNE_TO_LOW_SUPPLY_PENALTY':
            faction.immuneToLowSupplyPenalty = true;
            break;
        case 'MAX_MAT_STOCKPILE_MODIFIER':
            if (effect.value) {
                faction.maxMatStockpileModifier = (faction.maxMatStockpileModifier || 0) + effect.value;
            }
            break;
        case 'BUILD_FORTIFICATIONS_ADJACENT_NEUTRAL':
            faction.canFortifyAdjacentNeutral = true;
            break;
        case 'OVERFLOW_REINFORCEMENTS_TO_RESERVE_POOL':
            faction.overflowReinforcementsToReservePool = true;
            break;
        case 'MOVE_UNITS_LEAVE_ZERO_UNITS':
            faction.moveUnitsLeaveZeroUnits = true;
            break;
        case 'MAT_TO_GLOBAL_STOCKPILE':
            faction.matToGlobalStockpile = true;
            break;
        case 'SABOTAGE_TARGETS_GLOBAL_STOCKPILE':
            faction.sabotageTargetsGlobalStockpile = true;
            break;
        case 'RECOVER_LOST_UNITS_AFTER_BATTLE':
            if (effect.value) {
                faction.recoverLostUnitsAfterBattlePercentage = (faction.recoverLostUnitsAfterBattlePercentage || 0) + effect.value;
            }
            break;
        case 'UNIT_UPKEEP_ADJACENT_CN_MODIFIER':
            if (effect.value) {
                faction.unitUpkeepAdjacentCNModifier = (faction.unitUpkeepAdjacentCNModifier || 0) + effect.value;
            }
            break;
        case 'UNIT_UPKEEP_OTHER_UNITS_MODIFIER':
            if (effect.value) {
                faction.unitUpkeepOtherUnitsModifier = (faction.unitUpkeepOtherUnitsModifier || 0) + effect.value;
            }
            break;
        case 'FREE_MOVE_INTO_NEUTRAL_NODE':
            faction.freeMoveIntoNeutralNode = true;
            break;
        case 'NEUTRAL_NODE_CAPTURE_BONUS_REDUCTION':
            if (effect.value) {
                faction.neutralNodeCaptureBonusReduction = (faction.neutralNodeCaptureBonusReduction || 0) + effect.value;
            }
            break;
        case 'ENEMY_COMBAT_PENALTY_ADJACENT_RECON_ARRAY':
            if (effect.value) {
                faction.enemyCombatPenaltyAdjacentReconArray = (faction.enemyCombatPenaltyAdjacentReconArray || 0) + effect.value;
            }
            break;
        case 'OWN_RECON_ARRAY_ENEMY_ATTACK_BONUS':
            if (effect.value) {
                faction.ownReconArrayEnemyAttackBonus = (faction.ownReconArrayEnemyAttackBonus || 0) + effect.value;
            }
            break;
        case 'GAIN_MAT_ON_ENEMY_DEPLOYMENT':
            if (effect.value) {
                faction.gainMatOnEnemyDeployment = (faction.gainMatOnEnemyDeployment || 0) + effect.value;
            }
            break;
        case 'DISABLE_NEW_INFILTRATORS':
            faction.disableNewInfiltrators = true;
            break;
        default:
            console.warn(`Unhandled doctrine effect type: ${effect.type}`);
            break;
    }

    newGameState.factions[factionId] = faction;
    return newGameState;
};