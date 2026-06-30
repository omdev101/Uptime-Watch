class CreatePingResults < ActiveRecord::Migration[8.1]
  def change
    create_table :ping_results do |t|
      t.references :endpoint, null: false, foreign_key: true
      t.integer :status_code
      t.integer :response_time_ms

      t.timestamps
    end
  end
end
