if Gem.win_platform?
  require 'solid_queue/supervisor/signals'
  module SolidQueue
    class Supervisor
      module Signals
        remove_const :SIGNALS
        SIGNALS = %i[ INT TERM ].freeze
      end
    end
  end
end
