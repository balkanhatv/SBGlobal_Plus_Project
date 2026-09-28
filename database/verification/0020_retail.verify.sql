-- SBGlobal Plus — Verification 0020: Retail suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('rtl_rsm_store_day','RTL-RSM'),('rtl_rsm_cash_movement','RTL-RSM'),('rtl_rsm_counter_shift','RTL-RSM'),('rtl_rsm_checklist','RTL-RSM'),
    ('rtl_pos_session','RTL-POS'),('rtl_pos_sale','RTL-POS'),('rtl_pos_sale_line','RTL-POS'),('rtl_pos_tender','RTL-POS'),
    ('rtl_iwm_stock_balance','RTL-IWM'),('rtl_iwm_stock_movement','RTL-IWM'),('rtl_iwm_reservation','RTL-IWM'),('rtl_iwm_cycle_count','RTL-IWM'),
    ('rtl_oms_order','RTL-OMS'),('rtl_oms_order_line','RTL-OMS'),('rtl_oms_shipment','RTL-OMS'),('rtl_oms_return_case','RTL-OMS'),
    ('rtl_mkt_seller','RTL-MKT'),('rtl_mkt_listing','RTL-MKT'),('rtl_mkt_seller_order','RTL-MKT'),('rtl_mkt_settlement','RTL-MKT')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_rtl'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Retail RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_rtl'
    AND c.table_name IN (
      'rtl_rsm_store_day','rtl_rsm_cash_movement','rtl_rsm_counter_shift','rtl_rsm_checklist',
      'rtl_pos_session','rtl_pos_sale','rtl_pos_sale_line','rtl_pos_tender',
      'rtl_iwm_stock_balance','rtl_iwm_stock_movement','rtl_iwm_reservation','rtl_iwm_cycle_count',
      'rtl_oms_order','rtl_oms_order_line','rtl_oms_shipment','rtl_oms_return_case',
      'rtl_mkt_seller','rtl_mkt_listing','rtl_mkt_seller_order','rtl_mkt_settlement'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Retail ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_rtl' AND status='ACTIVE';

  IF ms_count <> 5 THEN
    RAISE EXCEPTION 'Expected 5 Retail canonical MS owners, found %', ms_count;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_rtl'
      AND indexname='rtl_pos_session_one_open_counter_cashier_idx'
  ) THEN
    RAISE EXCEPTION 'Retail one-open POS session invariant missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_rtl'
      AND indexname='rtl_iwm_stock_balance_scope_product_variant_uq'
  ) THEN
    RAISE EXCEPTION 'Retail nullable variant uniqueness hardening missing';
  END IF;
END $$;
