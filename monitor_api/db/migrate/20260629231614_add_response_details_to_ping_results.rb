class AddResponseDetailsToPingResults < ActiveRecord::Migration[8.1]
  def change
    add_column :ping_results, :response_body, :text
    add_column :ping_results, :response_headers, :jsonb
  end
end
