class CreateEndpoints < ActiveRecord::Migration[8.1]
  def change
    create_table :endpoints do |t|
      t.string :name
      t.string :url

      t.timestamps
    end
  end
end
