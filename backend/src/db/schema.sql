-- Tutorials
CREATE TABLE tutorials (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  difficulty    TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  total_steps   INT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tutorial Steps
CREATE TABLE tutorial_steps (
  id                   SERIAL PRIMARY KEY,
  tutorial_id          TEXT REFERENCES tutorials(id) ON DELETE CASCADE,
  step_number          INT NOT NULL,
  title                TEXT NOT NULL,
  instructions         TEXT NOT NULL,
  hint                 TEXT,
  -- React component name to render as the circuit diagram e.g. "PirAlarmStep3"
  circuit_component    TEXT,
  -- Expected wire connections for validation: [{ from: "PIR_VCC", to: "ARD_5V" }]
  expected_connections JSONB DEFAULT '[]',
  UNIQUE (tutorial_id, step_number)
);

-- Components Library
CREATE TABLE components (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL, -- boards, sensors, passives, actuators
  description TEXT,
  -- Pin definitions: [{ name: "VCC", type: "power" }, ...]
  pins        JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- User Sessions
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  tutorial_id   TEXT REFERENCES tutorials(id),
  current_step  INT DEFAULT 1,
  -- Full circuit state: placed components + wires
  circuit_state JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: PIR Alarm tutorial
INSERT INTO tutorials VALUES (
  'pir-alarm', 'PIR-based Alarm Circuit',
  'Build a motion-activated alarm using an Arduino Uno and PIR sensor.',
  'beginner', 8, NOW()
);

INSERT INTO tutorial_steps (tutorial_id, step_number, title, instructions, hint, circuit_component, expected_connections) VALUES
('pir-alarm', 1, 'Place the Arduino', 'Drag the Arduino Uno onto the canvas.', NULL, 'ArduinoUno', '[]'),
('pir-alarm', 2, 'Place the PIR Sensor', 'Drag the PIR sensor onto the canvas next to the Arduino.', NULL, 'PirSensor', '[]'),
('pir-alarm', 3, 'Connect VCC', 'Using a RED wire, connect the VCC pin of the PIR sensor to the 5V pin on the Arduino.', 'Look for the red terminal on the PIR sensor.', 'PirAlarmStep3', '[{"from":"PIR_VCC","to":"ARD_5V"}]'),
('pir-alarm', 4, 'Connect GND', 'Using a BLACK wire, connect the GND pin of the PIR sensor to a GND pin on the Arduino.', NULL, 'PirAlarmStep4', '[{"from":"PIR_GND","to":"ARD_GND"}]');

-- Seed: Components
INSERT INTO components VALUES
('arduino-uno', 'Arduino Uno', 'boards', 'ATmega328P microcontroller board', '[{"name":"5V","type":"power"},{"name":"GND","type":"ground"},{"name":"D13","type":"digital"},{"name":"D2","type":"digital"}]', NOW()),
('pir-sensor', 'PIR Sensor', 'sensors', 'Passive infrared motion sensor', '[{"name":"VCC","type":"power"},{"name":"GND","type":"ground"},{"name":"OUT","type":"signal"}]', NOW()),
('buzzer', 'Buzzer', 'actuators', 'Piezo buzzer for audio output', '[{"name":"VCC","type":"power"},{"name":"GND","type":"ground"}]', NOW()),
('led-red', 'LED Red', 'actuators', '5mm red LED', '[{"name":"anode","type":"power"},{"name":"cathode","type":"ground"}]', NOW()),
('resistor-220', 'Resistor 220Ω', 'passives', '220 ohm resistor', '[{"name":"pin1","type":"passive"},{"name":"pin2","type":"passive"}]', NOW());
