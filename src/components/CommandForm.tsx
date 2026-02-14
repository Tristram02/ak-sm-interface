import React, { useState } from 'react';
import type { CommandFormData, CommandAction } from '../types/xml.types';
import { buildXmlCommand } from '../utils/xmlBuilder';

interface CommandFormProps {
  onCommandGenerated: (xml: string) => void;
}

export const CommandForm: React.FC<CommandFormProps> = ({ onCommandGenerated }) => {
  const [formData, setFormData] = useState<CommandFormData>({
    action: 'read_val',
    nodetype: 16,
    node: 12,
    cid: 0,
    vid: 0,
    mod: 0,
    point: 0,
  });

  const [generatedXml, setGeneratedXml] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleInputChange = (field: keyof CommandFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = () => {
    const xml = buildXmlCommand(formData);
    setGeneratedXml(xml);
    onCommandGenerated(xml);
  };

  const commandActions: CommandAction[] = [
    // Alarm Commands
    'read_generic_alarms',
    'read_device_alarms',
    'alarm_summary',
    'alarm_detail',
    'write_alarm_ack',
    'write_alarm_clear',
    
    // Read Commands
    'read_val',
    'read_units',
    'read_parm_info',
    'read_parm_limits',
    'read_device_info',
    'read_devices',
    'read_controllers',
    'read_meters',
    'read_meter',
    'read_menu',
    'read_menu_info',
    'read_menu_groups',
    'read_device_summary',
    
    // Schedule Commands
    'schedule_summary',
    'schedule_detail',
    'read_store_schedule',
    'write_store_schedule',
    'set_store_time',
    
    // HVAC Commands
    'read_hvac_service',
    'set_hvac_service',
    'read_hvacs',
    'read_hvac_unit',
    'write_hvac_unit',
    'write_hvac_setback',
    
    // Lighting Commands
    'read_lighting',
    'read_lighting_zone',
    'set_zone_override',
    'write_lighting_zone',
    
    // Holiday Commands
    'read_holidays',
    'write_holiday_sch',
    
    // Refrigeration Commands
    'set_offset',
    'read_suction_group',
    'set_suction_group',
    'read_circuit',
    'set_circuit',
    'read_condenser',
    'set_condenser',
    
    // I/O Commands
    'read_inputs',
    'read_relays',
    'read_alarm_relays',
    'read_sensors',
    'read_var_outs',
    'read_input',
    'read_relay',
    'read_sensor',
    'read_var_out',
    
    // Monitor Commands
    'read_monitor_summary',
    'read_monitor_detail',
    'set_monitor_point',
    
    // History Commands
    'read_history',
    'read_history_cfg',
    'read_device_history_cfg',
    'start_history_query',
    'read_query_status',
    'read_query_data',
    'abort_query',
    
    // Write Commands
    'write_digi_op',
    'write_val',
    
    // Control Commands
    'set_defrost',
    'set_light',
    'set_main_switch',
    'set_cleaning',
    'set_night_setback',
    'set_shutdown',
    
    // System Commands
    'read_system_status',
    'read_license_data',
  ];

  const filteredCommands = commandActions.filter(cmd => 
    cmd.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="command-form">
      <h2>Build XML Command</h2>
      
      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="command-search">Search Commands (75 total)</label>
          <input
            id="command-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to filter commands..."
            className="search-input"
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="action">Command Action</label>
          <select
            id="action"
            value={formData.action}
            onChange={(e) => handleInputChange('action', e.target.value as CommandAction)}
            size={8}
            className="command-select"
          >
            {filteredCommands.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <p className="command-count">{filteredCommands.length} commands shown</p>
        </div>

        <div className="form-group">
          <label htmlFor="nodetype">Node Type</label>
          <input
            id="nodetype"
            type="number"
            value={formData.nodetype}
            onChange={(e) => handleInputChange('nodetype', parseInt(e.target.value, 10))}
            placeholder="16"
          />
        </div>

        <div className="form-group">
          <label htmlFor="node">Node</label>
          <input
            id="node"
            type="number"
            value={formData.node}
            onChange={(e) => handleInputChange('node', parseInt(e.target.value, 10))}
            placeholder="12"
          />
        </div>

        {formData.action === 'read_val' && (
          <>
            <div className="form-group">
              <label htmlFor="cid">CID (optional)</label>
              <input
                id="cid"
                type="number"
                value={formData.cid || ''}
                onChange={(e) => handleInputChange('cid', parseInt(e.target.value, 10) || 0)}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="vid">VID (optional)</label>
              <input
                id="vid"
                type="number"
                value={formData.vid || ''}
                onChange={(e) => handleInputChange('vid', parseInt(e.target.value, 10) || 0)}
                placeholder="0"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="mod">Mod</label>
          <input
            id="mod"
            type="number"
            value={formData.mod || ''}
            onChange={(e) => handleInputChange('mod', parseInt(e.target.value, 10) || 0)}
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="point">Point</label>
          <input
            id="point"
            type="number"
            value={formData.point || ''}
            onChange={(e) => handleInputChange('point', parseInt(e.target.value, 10) || 0)}
            placeholder="0"
          />
        </div>
      </div>

      <button className="generate-btn" onClick={handleGenerate}>
        Generate XML Command
      </button>

      {generatedXml && (
        <div className="xml-preview">
          <h3>Generated XML</h3>
          <pre><code>{generatedXml}</code></pre>
        </div>
      )}
    </div>
  );
};
