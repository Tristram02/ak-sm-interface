// XML Command Types based on Danfoss AK System Manager specification

export interface XmlCommandAttributes {
  action: string;
  nodetype?: number;
  node?: number;
  mod?: number;
  point?: number;
  cid?: number;
  vid?: number;
  tag?: string;
  field?: string;
  num_only?: number;
  valid_only?: number;
  units?: string;
}

export interface ReadValCommand {
  nodetype: number;
  node: number;
  cid?: number;
  vid?: number;
  tag?: string;
  field?: string;
}

export interface XmlResponse {
  action: string;
  error: number;
  data?: unknown;
  rawXml?: string;
}

export interface ValueResponse {
  node: number;
  vid?: number;
  cid?: number;
  tag?: string;
  field?: string;
  nodetype: number;
  display?: string;
  name?: string;
  stat?: string;
  statcode?: number;
  pending?: boolean;
  value?: string;
  min?: string;
  max?: string;
  def?: string;
}

// All 75 commands
export type CommandAction = 
  // Alarm Commands
  | 'read_generic_alarms'
  | 'read_device_alarms'
  | 'alarm_summary'
  | 'alarm_detail'
  | 'write_alarm_ack'
  | 'write_alarm_clear'
  
  // Read Commands
  | 'read_val'
  | 'read_units'
  | 'read_parm_info'
  | 'read_parm_limits'
  | 'read_device_info'
  | 'read_devices'
  | 'read_controllers'
  | 'read_meters'
  | 'read_meter'
  | 'read_menu'
  | 'read_menu_info'
  | 'read_menu_groups'
  | 'read_device_summary'
  
  // Schedule Commands
  | 'schedule_summary'
  | 'schedule_detail'
  | 'read_store_schedule'
  | 'write_store_schedule'
  | 'set_store_time'
  
  // HVAC Commands
  | 'read_hvac_service'
  | 'set_hvac_service'
  | 'read_hvacs'
  | 'read_hvac_unit'
  | 'write_hvac_unit'
  | 'write_hvac_setback'
  
  // Lighting Commands
  | 'read_lighting'
  | 'read_lighting_zone'
  | 'set_zone_override'
  | 'write_lighting_zone'
  
  // Holiday Commands
  | 'read_holidays'
  | 'write_holiday_sch'
  
  // Refrigeration Commands
  | 'set_offset'
  | 'read_suction_group'
  | 'set_suction_group'
  | 'read_circuit'
  | 'set_circuit'
  | 'read_condenser'
  | 'set_condenser'
  
  // I/O Commands
  | 'read_inputs'
  | 'read_relays'
  | 'read_alarm_relays'
  | 'read_sensors'
  | 'read_var_outs'
  | 'read_input'
  | 'read_relay'
  | 'read_sensor'
  | 'read_var_out'
  
  // Monitor Commands
  | 'read_monitor_summary'
  | 'read_monitor_detail'
  | 'set_monitor_point'
  
  // History Commands
  | 'read_history'
  | 'read_history_cfg'
  | 'read_device_history_cfg'
  | 'start_history_query'
  | 'read_query_status'
  | 'read_query_data'
  | 'abort_query'
  
  // Write Commands
  | 'write_digi_op'
  | 'write_val'
  
  // Control Commands
  | 'set_defrost'
  | 'set_light'
  | 'set_main_switch'
  | 'set_cleaning'
  | 'set_night_setback'
  | 'set_shutdown'
  
  // System Commands
  | 'read_system_status'
  | 'read_license_data';

export interface CommandFormData {
  action: CommandAction;
  nodetype: number;
  node: number;
  cid?: number;
  vid?: number;
  mod?: number;
  point?: number;
}

export enum NodeType {
  AK2_CONTROLLER = 16,
  EKC_CONTROLLER = 17,
  SUCTION_GROUP = 32,
  CIRCUIT = 33,
  CONDENSER = 34,
}

export enum ErrorCode {
  SUCCESS = 0,
  INVALID_COMMAND = 1,
  INVALID_PARAMETER = 2,
  DEVICE_OFFLINE = 3,
  TIMEOUT = 4,
  UNKNOWN_ERROR = 99,
}
