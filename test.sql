CREATE OR REPLACE FUNCTION binbit.ctrl_get_oo_fact_fact_routine_data_by_fact_routine_id(p_operator_id integer, p_date_partition date, p_fact_routine_id bigint, OUT c_fact_params_data hstore, OUT c_fact_incoming_data hstore, OUT c_fact_specific_data hstore, OUT c_fact_rtn_incoming_data text)
  RETURNS record AS
$BODY$
DECLARE
	v_oo_fact_id bigint;
	v_origin_id integer;
	v_notication_type_id integer;
	v_user_id integer;
	v_phone text;
	v_event_type_service_id integer;
	v_tracking_number text;
	v_ts_incoming timestamp with time zone;

BEGIN
	c_fact_params_data = '';

  


	SELECT m_oo_fact_id, m_notification_type_id, m_phone, m_event_type_service_id, m_user_id, m_tracking_number, m_ts_incoming_ofct, m_origin_id, m_incoming_fact_data, m_specific_fact_data, m_incoming_fact_routine_data FROM md_get_oo_fact_fact_routine_data_by_fact_routine_id(p_operator_id, p_date_partition, p_fact_routine_id) INTO v_oo_fact_id, v_notication_type_id, v_phone, v_event_type_service_id, v_user_id, v_tracking_number, v_ts_incoming, v_origin_id, c_fact_incoming_data, c_fact_specific_data, c_fact_rtn_incoming_data;

		c_fact_params_data = c_fact_params_data || hstore(ARRAY['notificationTypeId', v_notication_type_id::text, 'operatorId', p_operator_id::text, 'eventTypeServiceId', v_event_type_service_id::text, 'ooFactId', v_oo_fact_id::text, 'datePartition', p_date_partition::text, 'tsNotificationFact'::text, v_ts_incoming::text, 'phone', v_phone, 'userId', v_user_id::text, 'originId', v_origin_id::text, 'trackingNumber', v_tracking_number, 'routineOoFactId', p_fact_routine_id::text]);

END;
$BODY$
  LANGUAGE plpgsql STABLE
  COST 100;
ALTER FUNCTION binbit.ctrl_get_oo_fact_fact_routine_data_by_fact_routine_id(p_operator_id integer, p_date_partition date, p_fact_routine_id bigint, OUT c_fact_params_data hstore, OUT c_fact_incoming_data hstore, OUT c_fact_specific_data hstore, OUT c_fact_rtn_incoming_data text)
OWNER TO r_platform_admin;
