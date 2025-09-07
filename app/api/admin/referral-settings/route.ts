import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM referral_settings 
      ORDER BY updated_at DESC 
      LIMIT 1
    `)

    if (result.rows.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        firstDepositCommission: 5.0,
        firstDepositCommissionEnabled: true,
        firstPurchaseCommission: 1.0,
        firstPurchaseCommissionEnabled: true,
        firstPurchasePeriodValue: 3,
        firstPurchasePeriodUnit: "days",
        microjobWorkBonus: 2.0,
        microjobWorkBonusEnabled: true,
        signUpBonus: 0.005,
        signUpBonusEnabled: true,
        lifetimeCommissionMin: 0.05,
        lifetimeCommissionMax: 20.0,
        lifetimeCommissionEnabled: true,
        referPageTitle: "Vip Refer",
        referPageText:
          "* Every Successfully Vip Refer For You Earn $\n\n* To Become a Vip Refer * Refer Have To Complete 3 Job ✅ Or\n\n* Refer have to Deposit Any Amount ✅\n\n* Every refers and Vip Refer from You get lifetime commission it's can be ( 0.05-20% )✅",
        status: true,
        requireJobCompletion: true,
        requireDeposit: false,
        minJobsForVip: 3,
      }
      return NextResponse.json(defaultSettings)
    }

    const settings = result.rows[0]
    const formattedSettings = {
      firstDepositCommission: settings.first_deposit_commission,
      firstDepositCommissionEnabled: settings.first_deposit_commission_enabled,
      firstPurchaseCommission: settings.first_purchase_commission,
      firstPurchaseCommissionEnabled: settings.first_purchase_commission_enabled,
      firstPurchasePeriodValue: settings.first_purchase_period_value,
      firstPurchasePeriodUnit: settings.first_purchase_period_unit,
      microjobWorkBonus: settings.microjob_work_bonus,
      microjobWorkBonusEnabled: settings.microjob_work_bonus_enabled,
      signUpBonus: settings.sign_up_bonus,
      signUpBonusEnabled: settings.sign_up_bonus_enabled,
      lifetimeCommissionMin: settings.lifetime_commission_min,
      lifetimeCommissionMax: settings.lifetime_commission_max,
      lifetimeCommissionEnabled: settings.lifetime_commission_enabled,
      referPageTitle: settings.refer_page_title,
      referPageText: settings.refer_page_text,
      status: settings.status,
      requireJobCompletion: settings.require_job_completion,
      requireDeposit: settings.require_deposit,
      minJobsForVip: settings.min_jobs_for_vip,
    }

    return NextResponse.json(formattedSettings)
  } catch (error) {
    console.error("Error fetching referral settings:", error)

    if (error instanceof Error && error.message.includes('relation "referral_settings" does not exist')) {
      return NextResponse.json(
        {
          error: "Database table 'referral_settings' does not exist. Please run the database setup scripts first.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    const result = await query(
      `
      INSERT INTO referral_settings (
        first_deposit_commission, first_deposit_commission_enabled,
        first_purchase_commission, first_purchase_commission_enabled,
        first_purchase_period_value, first_purchase_period_unit,
        microjob_work_bonus, microjob_work_bonus_enabled,
        sign_up_bonus, sign_up_bonus_enabled,
        lifetime_commission_min, lifetime_commission_max, lifetime_commission_enabled,
        refer_page_title, refer_page_text,
        status, require_job_completion, require_deposit, min_jobs_for_vip
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (id) DO UPDATE SET
        first_deposit_commission = EXCLUDED.first_deposit_commission,
        first_deposit_commission_enabled = EXCLUDED.first_deposit_commission_enabled,
        first_purchase_commission = EXCLUDED.first_purchase_commission,
        first_purchase_commission_enabled = EXCLUDED.first_purchase_commission_enabled,
        first_purchase_period_value = EXCLUDED.first_purchase_period_value,
        first_purchase_period_unit = EXCLUDED.first_purchase_period_unit,
        microjob_work_bonus = EXCLUDED.microjob_work_bonus,
        microjob_work_bonus_enabled = EXCLUDED.microjob_work_bonus_enabled,
        sign_up_bonus = EXCLUDED.sign_up_bonus,
        sign_up_bonus_enabled = EXCLUDED.sign_up_bonus_enabled,
        lifetime_commission_min = EXCLUDED.lifetime_commission_min,
        lifetime_commission_max = EXCLUDED.lifetime_commission_max,
        lifetime_commission_enabled = EXCLUDED.lifetime_commission_enabled,
        refer_page_title = EXCLUDED.refer_page_title,
        refer_page_text = EXCLUDED.refer_page_text,
        status = EXCLUDED.status,
        require_job_completion = EXCLUDED.require_job_completion,
        require_deposit = EXCLUDED.require_deposit,
        min_jobs_for_vip = EXCLUDED.min_jobs_for_vip,
        updated_at = NOW()
      RETURNING *
    `,
      [
        settings.firstDepositCommission,
        settings.firstDepositCommissionEnabled,
        settings.firstPurchaseCommission,
        settings.firstPurchaseCommissionEnabled,
        settings.firstPurchasePeriodValue,
        settings.firstPurchasePeriodUnit,
        settings.microjobWorkBonus,
        settings.microjobWorkBonusEnabled,
        settings.signUpBonus,
        settings.signUpBonusEnabled,
        settings.lifetimeCommissionMin,
        settings.lifetimeCommissionMax,
        settings.lifetimeCommissionEnabled,
        settings.referPageTitle,
        settings.referPageText,
        settings.status,
        settings.requireJobCompletion,
        settings.requireDeposit,
        settings.minJobsForVip,
      ],
    )

    const savedSettings = result.rows[0]
    const formattedResponse = {
      firstDepositCommission: savedSettings.first_deposit_commission,
      firstDepositCommissionEnabled: savedSettings.first_deposit_commission_enabled,
      firstPurchaseCommission: savedSettings.first_purchase_commission,
      firstPurchaseCommissionEnabled: savedSettings.first_purchase_commission_enabled,
      firstPurchasePeriodValue: savedSettings.first_purchase_period_value,
      firstPurchasePeriodUnit: savedSettings.first_purchase_period_unit,
      microjobWorkBonus: savedSettings.microjob_work_bonus,
      microjobWorkBonusEnabled: savedSettings.microjob_work_bonus_enabled,
      signUpBonus: savedSettings.sign_up_bonus,
      signUpBonusEnabled: savedSettings.sign_up_bonus_enabled,
      lifetimeCommissionMin: savedSettings.lifetime_commission_min,
      lifetimeCommissionMax: savedSettings.lifetime_commission_max,
      lifetimeCommissionEnabled: savedSettings.lifetime_commission_enabled,
      referPageTitle: savedSettings.refer_page_title,
      referPageText: savedSettings.refer_page_text,
      status: savedSettings.status,
      requireJobCompletion: savedSettings.require_job_completion,
      requireDeposit: savedSettings.require_deposit,
      minJobsForVip: savedSettings.min_jobs_for_vip,
    }

    return NextResponse.json(formattedResponse)
  } catch (error) {
    console.error("Error saving referral settings:", error)

    if (error instanceof Error && error.message.includes('relation "referral_settings" does not exist')) {
      return NextResponse.json(
        {
          error: "Database table 'referral_settings' does not exist. Please run the database setup scripts first.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
